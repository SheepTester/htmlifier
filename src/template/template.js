const noop = () => null

window.Scratch = {
  get vm () {
    return window.vm
  },
  get renderer () {
    return window.vm.runtime.renderer
  },
  get audioEngine () {
    return window.vm.runtime.audioEngine
  },
  get bitmapAdapter () {
    return window.vm.runtime.v2BitmapAdapter
  },
  get videoProvider () {
    return window.vm.runtime.ioDevices.video.provider
  }
}

const CLOUD_PREFIX = '\u2601 '
window.setCloud = (name, value) => {
  vm.postIOData('cloud', {
    varUpdate: {
      name: CLOUD_PREFIX + name,
      value
    }
  })
}
function postError (err) {
  setCloud('eval error', err.toString())
}

class CloudProvider {
  constructor (serverUrl, specialBehaviours) {
    this._serverUrl = serverUrl
    this._specialBehaviours = specialBehaviours

    this._ws = null

    this.createVariable = noop
    this.renameVariable = noop
    this.deleteVariable = noop

    this._handleMessage = event => {
      event.data.split('\n').forEach(message => {
        if (message) {
          const { name, value } = JSON.parse(message)
          vm.postIOData('cloud', {
            varUpdate: { name, value }
          })
        }
      })
    }
    this._handleOpen = () => {
      sendData({ method: 'handshake' })
    }
    this._handleClose = () => {
      setTimeout(openConnection, 500)
    }

    this.handleUrlChange = () => {
      setCloud('url', window.location.href)
    }
    if (specialBehaviours) {
      window.addEventListener('hashchange', this.handleUrlChange)
      window.addEventListener('popstate', this.handleUrlChange)
      // Paste output
      window.addEventListener('paste', event => {
        setCloud(
          'pasted',
          (event.clipboardData || window.clipboardData).getData('text')
        )
      })
    }
  }

  _openConnection () {
    try {
      this._ws = new WebSocket(this._serverUrl)
    } catch (error) {
      console.warn(error)
      return
    }
    this._ws.onmessage = this._handleMessage
    this._ws.onopen = this._handleOpen
    this._ws.onclose = this._handleClose
  }

  _sendData (data) {
    data.user = options.username
    data.project_id = options.projectId
    this._ws.send(JSON.stringify(data) + '\n')
  }

  updateVariable (name, value) {
    if (this._specialBehaviours) {
      let matched = true
      if (name === CLOUD_PREFIX + 'eval') {
        try {
          Promise.resolve(eval(value))
            .then(output => {
              setCloud('eval output', output)
            })
            .catch(postError)
        } catch (error) {
          postError(error)
        }
      } else if (name === CLOUD_PREFIX + 'open link') {
        try {
          window.open(value, '_blank')
        } catch (error) {
          postError(error)
        }
      } else if (name === CLOUD_PREFIX + 'redirect') {
        window.location = value
      } else if (name === CLOUD_PREFIX + 'set clipboard') {
        try {
          navigator.clipboard.writeText(value).catch(postError)
        } catch (error) {
          postError(error)
        }
      } else if (name === CLOUD_PREFIX + 'set server ip') {
        this._cloudHost = value
        if (this._ws) {
          this._ws.onclose = noop
          this._ws.close()
        }
        openConnection()
      } else if (name === CLOUD_PREFIX + 'username') {
        vm.postIOData('userData', { username: value })
      } else {
        matched = false
      }
      if (matched) {
        return
      }
    }
    if (
      !this._serverUrl ||
      (this._specialBehaviours &&
        name.startsWith(CLOUD_PREFIX + 'local storage'))
    ) {
      try {
        localStorage.setItem('[s3] ' + name, value)
      } catch (error) {
        postError(error)
      }
    } else {
      this._sendData({ method: 'set', name, value })
    }
  }

  requestCloseConnection () {
    if (
      this._ws &&
      this._ws.readyState !== WebSocket.CLOSING &&
      this._ws.readyState !== WebSocket.CLOSED
    ) {
      this._ws.onclose = noop
      this._ws.close()
    }
  }
}

// Based on
// https://github.com/LLK/scratch-gui/blob/7b658c60c7c04055e575601a861195fe6c9933f3/src/lib/video/camera.js
// https://github.com/LLK/scratch-gui/blob/7b658c60c7c04055e575601a861195fe6c9933f3/src/lib/video/video-provider.js
class VideoProvider {
  constructor (width, height) {
    this._dimensions = [width, height]
    this.mirror = true
    this._frameCacheTimeout = 16
    this._video = null
    this._track = null
    this._workspace = []
  }

  get video () {
    return this._video
  }

  enableVideo () {
    this.enabled = true
    return this._setupVideo()
  }

  disableVideo () {
    this.enabled = false
    if (this._singleSetup) {
      this._singleSetup
        .then(this._teardown.bind(this))
        .catch(err => this.onError(err))
    }
  }

  _teardown () {
    if (this.enabled === false) {
      requestStack.pop()
      const disableTrack = requestStack.length === 0
      this._singleSetup = null
      this._video = null
      if (this._track && disableTrack) {
        this._track.stop()
      }
      this._track = null
    }
  }

  getFrame ({
    dimensions = this._dimensions,
    mirror = this.mirror,
    format = 'image-data',
    cacheTimeout = this._frameCacheTimeout
  }) {
    if (!this.videoReady) {
      return null
    }
    const [width, height] = dimensions
    const workspace = this._getWorkspace({
      dimensions,
      mirror: Boolean(mirror)
    })
    const { videoWidth, videoHeight } = this._video
    const { canvas, context, lastUpdate, cacheData } = workspace
    const now = Date.now()

    if (lastUpdate + cacheTimeout < now) {
      if (mirror) {
        context.scale(-1, 1)
        context.translate(width * -1, 0)
      }

      context.drawImage(
        this._video,
        0,
        0,
        videoWidth,
        videoHeight,
        0,
        0,
        width,
        height
      )

      context.setTransform(1, 0, 0, 1, 0, 0)
      workspace.lastUpdate = now
    }

    if (!cacheData[format]) {
      cacheData[format] = { lastUpdate: 0 }
    }
    const formatCache = cacheData[format]

    if (formatCache.lastUpdate + cacheTimeout < now) {
      if (format === 'image-data') {
        formatCache.lastData = context.getImageData(0, 0, width, height)
      } else if (format === 'canvas') {
        formatCache.lastUpdate = Infinity
        formatCache.lastData = canvas
      } else {
        console.error(`video io error - unimplemented format ${format}`)
        formatCache.lastUpdate = Infinity
        formatCache.lastData = null
      }

      formatCache.lastUpdate = Math.max(
        workspace.lastUpdate,
        formatCache.lastUpdate
      )
    }

    return formatCache.lastData
  }

  onError (error) {
    console.error('Unhandled video io device error', error)
  }

  _setupVideo () {
    if (this._singleSetup) {
      return this._singleSetup
    }

    if (requestStack.length === 0) {
      this._singleSetup = navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { min: width, ideal: (480 * width) / height },
          height: { min: height, ideal: 480 }
        }
      })
      requestStack.push(streamPromise)
    } else if (requestStack.length > 0) {
      this._singleSetup = requestStack[0]
      requestStack.push(true)
    }
    this._singleSetup
      .then(stream => {
        this._video = document.createElement('video')

        try {
          this._video.srcObject = stream
        } catch (error) {
          this._video.src = window.URL.createObjectURL(stream)
        }
        this._video.play()
        this._track = stream.getTracks()[0]
        return this
      })
      .catch(error => {
        this._singleSetup = null
        this.onError(error)
      })

    return this._singleSetup
  }

  get videoReady () {
    if (!this.enabled || !this._video || !this._track) {
      return false
    }
    const { videoWidth, videoHeight } = this._video
    return (
      typeof videoWidth === 'number' &&
      typeof videoHeight === 'number' &&
      videoWidth > 0 &&
      videoHeight > 0
    )
  }

  _getWorkspace ({ dimensions, mirror }) {
    let workspace = this._workspace.find(
      space =>
        space.dimensions.join('-') === dimensions.join('-') &&
        space.mirror === mirror
    )
    if (!workspace) {
      workspace = {
        dimensions,
        mirror,
        canvas: document.createElement('canvas'),
        lastUpdate: 0,
        cacheData: {}
      }
      workspace.canvas.width = dimensions[0]
      workspace.canvas.height = dimensions[1]
      workspace.context = workspace.canvas.getContext('2d')
      this._workspace.push(workspace)
    }
    return workspace
  }
}

const fullscreenBtn = document.getElementById('fullscreen-btn')
const exitFullscreen =
  document.exitFullscreen ||
  document.msExitFullscreen ||
  document.mozCancelFullScreen ||
  document.webkitExitFullscreen
const requestFullscreen =
  document.body.requestFullscreen ||
  document.body.msRequestFullscreen ||
  document.body.mozRequestFullScreen ||
  document.body.webkitRequestFullscreen
function isFullscreen () {
  return (
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  )
}
fullscreenBtn.addEventListener('click', e => {
  fullscreenBtn.blur()
  if (isFullscreen()) {
    exitFullscreen()
  } else {
    requestFullscreen()
  }
})
function handleFullscreenChange () {
  if (isFullscreen()) {
    document.body.classList.add('fullscreen')
  } else {
    document.body.classList.remove('fullscreen')
  }
}
document.addEventListener('fullscreenchange', handleFullscreenChange)
document.addEventListener('mozfullscreenchange', handleFullscreenChange)
document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
document.addEventListener('msfullscreenchange', handleFullscreenChange)

async function init ({ width, height, ...options }) {
  window.vm = new window.NotVirtualMachine(width, height)
  vm.setCompatibilityMode(options.fps)
  vm.setTurboMode(options.turbo)
  vm.requireLimits(options.limits)

  const storage = new ScratchStorage()
  const AssetType = storage.AssetType
  if (options.assets.project) {
    storage.addWebStore([AssetType.Project], () => options.assets.project)
    storage.addWebStore(
      [AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound],
      ({ assetId, dataFormat }) => options.assets[`${assetId}.${dataFormat}`]
    )
  }
  const progress = document.getElementById('loading-progress')
  if (options.loadingProgress) {
    const _load = storage.webHelper.load
    let total = 0,
      complete = 0
    storage.webHelper.load = function (...args) {
      const result = _load.call(this, ...args)
      total += 1
      progress.dataset.progress = complete + '/' + total
      progress.style.setProperty('--progress', (complete / total) * 100 + '%')
      result.then(() => {
        complete += 1
        progress.dataset.progress = complete + '/' + total
        progress.style.setProperty('--progress', (complete / total) * 100 + '%')
      })
      return result
    }
  }
  vm.attachStorage(storage)

  function resize () {
    const rect = canvas.getBoundingClientRect()
    renderer.resize(rect.width, rect.height)
    if (options.stretchStage) {
      monitorWrapper.style.transform = `scaleX(${rect.width /
        width}) scaleY(${rect.height / height})`
    } else {
      monitorWrapper.style.transform = `scale(${rect.height / height})`
    }
  }
  const monitorWrapper = document.getElementById('monitors')
  const canvas = document.getElementById('stage')
  const renderer = new window.ScratchRender(
    canvas,
    -width / 2,
    width / 2,
    -height / 2,
    height / 2
  )
  resize()
  vm.attachRenderer(renderer)

  vm.attachAudioEngine(new window.AudioEngine())
  vm.attachV2BitmapAdapter(
    new ScratchSVGRenderer.BitmapAdapter(null, null, width, height)
  )
  vm.setVideoProvider(new VideoProvider(width, height))
  vm.start()

  /* https://github.com/LLK/scratch-gui/blob/develop/src/containers/stage.jsx#L176-L300 */
  const getEventXY = e => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.changedTouches && e.changedTouches[0]) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }
  let mouseDown = false
  let mouseDownPosition = null
  let mouseDownTimeoutId = null
  let isDragging = false
  let dragId = null
  let dragOffset = null
  function cancelMouseDownTimeout () {
    if (mouseDownTimeoutId !== null) {
      clearTimeout(mouseDownTimeoutId)
    }
    mouseDownTimeoutId = null
  }
  // https://github.com/LLK/scratch-gui/blob/develop/src/containers/stage.jsx#L337-L366
  function handleStartDrag () {
    if (dragId || !mouseDownPosition) return
    const drawableId = renderer.pick(mouseDownPosition.x, mouseDownPosition.y)
    if (drawableId === null) return
    const targetId = vm.getTargetIdForDrawableId(drawableId)
    if (targetId === null) return
    const target = vm.runtime.getTargetById(targetId)
    if (!target || !target.draggable) return
    target.goToFront()
    const drawableData = renderer.extractDrawable(
      drawableId,
      mouseDownPosition.x,
      mouseDownPosition.y
    )
    vm.startDrag(targetId)
    isDragging = true
    dragId = targetId
    dragOffset = drawableData.scratchOffset
  }
  let accumulative = { x: 0, y: 0 }
  function postIfPointerLocked (e, isDown) {
    if (
      document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas
    ) {
      accumulative.x += e.movementX
      accumulative.y += e.movementY
      vm.postIOData('mouse', {
        isDown,
        x: accumulative.x + width / 2,
        y: accumulative.y + height / 2,
        canvasWidth: width,
        canvasHeight: height
      })
      return true
    } else {
      return false
    }
  }
  function postMouse (event, isDown) {
    const { x, y } = getEventXY(event)
    const rect = canvas.getBoundingClientRect()
    const mousePosition = { x: x - rect.left, y: y - rect.top }
    vm.postIOData('mouse', {
      isDown,
      ...mousePosition,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    })
    return mousePosition
  }
  function handleMouseMove (event) {
    if (postIfPointerLocked(event)) return
    const mousePosition = postMouse(event)
    if (mouseDown && !isDragging) {
      const distanceFromMouseDown = Math.hypot(
        mousePosition.x - mouseDownPosition.x,
        mousePosition.y - mouseDownPosition.y
      )
      if (distanceFromMouseDown > 3) {
        cancelMouseDownTimeout()
        handleStartDrag()
      }
    }
    if (mouseDown && isDragging) {
      const nativeSize = renderer.getNativeSize()
      vm.postSpriteInfo({
        x:
          (nativeSize[0] / rect.width) * (mousePosition.x - rect.width / 2) +
          dragOffset[0],
        y: -(
          (nativeSize[1] / rect.height) * (mousePosition.y - rect.height / 2) +
          dragOffset[1]
        ),
        force: true
      })
    }
  }
  function handleMouseDown (event) {
    mouseDown = true
    vm.postIOData('keyboard', {
      key: 'Mouse' + event.which,
      isDown: true
    })
    if (postIfPointerLocked(event, true)) return
    mouseDownPosition = postMouse(event, true)
    mouseDownTimeoutId = setTimeout(handleStartDrag, 400)
    event.preventDefault()
    if (!document.body.classList.contains('asking')) {
      window.focus()
    }
  }
  function handleMouseUp (event) {
    cancelMouseDownTimeout()
    mouseDown = false
    mouseDownPosition = null
    if (isDragging) {
      vm.stopDrag(dragId)
      isDragging = false
      dragOffset = null
      dragId = null
    }
    vm.postIOData('keyboard', {
      key: 'Mouse' + event.which,
      isDown: false
    })
    if (postIfPointerLocked(event, false)) return
    postMouse(event, false)
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', handleMouseMove)
  document.addEventListener('touchend', handleMouseUp, { passive: false })
  canvas.addEventListener('wheel', event => {
    vm.postIOData('mouseWheel', event)
    event.preventDefault()
  })
  window.addEventListener('resize', resize)
  canvas.addEventListener('contextmenu', event => {
    event.preventDefault()
  })
  if (options.pointerLock) {
    canvas.requestPointerLock =
      canvas.requestPointerLock || canvas.mozRequestPointerLock
    canvas.addEventListener('click', () => {
      canvas.requestPointerLock()
    })
  }

  /**
   * Maps e.key to e.code. For example, Shift -> ShiftRight. This is because the
   * keyup event doesn't fire when you let go of one shift if the other shift
   * key is still held down.
   */
  const keyToCode = new Map()
  function postKey (event, isDown) {
    const key = !event.key || event.key === 'Dead' ? event.keyCode : event.key
    vm.postIOData('keyboard', {
      key: key,
      isDown
    })
    vm.postIOData('keyboard', {
      key: 'code_' + event.code,
      isDown
    })
  }
  document.addEventListener('keydown', event => {
    if (event.target !== document && event.target !== document.body) return
    const prevCode = keyToCode.get(event.key)
    if (prevCode) {
      if (prevCode !== event.code) {
        vm.postIOData('keyboard', {
          key: 'code_' + prevCode,
          isDown: false
        })
      }
    }
    postKey(event, true)
    keyToCode.set(event.key, event.code)
    if (event.keyCode === 32 || (event.keyCode >= 37 && event.keyCode <= 40)) {
      event.preventDefault()
    }
  })
  document.addEventListener('keyup', e => {
    postKey(e, false)
    keyToCode.delete(e.key)
    if (e.target !== document && e.target !== document.body) {
      e.preventDefault()
    }
  })

  const question = document.getElementById('question')
  const askBox = document.getElementById('answer')
  vm.runtime.addListener('QUESTION', questionData => {
    // null means the question was interrupted by stop script block
    if (questionData === null) {
      document.body.classList.remove('asking')
    } else {
      document.body.classList.add('asking')
      question.textContent = questionData
      askBox.value = ''
      askBox.focus()
    }
  })
  askBox.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      // The asking class must be removed first because the VM may start the
      // next question immediately inside the .emit call
      document.body.classList.remove('asking')
      vm.runtime.emit('ANSWER', askBox.value)
    }
  })

  const getVariable = (targetId, variableId) => {
    const target = targetId
      ? vm.runtime.getTargetById(targetId)
      : vm.runtime.getTargetForStage()
    return target.variables[variableId]
  }
  const monitorStates = {}
  let once = false
  vm.runtime.addListener('MONITORS_UPDATE', monitors => {
    monitors.forEach((record, id) => {
      if (!monitorStates[id]) {
        const monitor = document.createElement('div')
        monitor.className = 'monitor ' + record.mode
        monitor.style.left = record.x + 'px'
        monitor.style.top = record.y + 'px'
        if (record.mode === 'list') {
          // If the list has never been resized, the width/height will be 0.
          // Weird!
          monitor.style.width = (record.width || 100) + 'px'
          monitor.style.height = (record.height || 200) + 'px'
        }
        const label = document.createElement('span')
        label.className = 'monitor-label'
        let name = record.params.VARIABLE || record.params.LIST || record.opcode
        if (record.spriteName) name = `${record.spriteName}: ${name}`
        label.textContent = name
        monitor.appendChild(label)
        const value = document.createElement('span')
        value.className = 'monitor-value'
        monitor.appendChild(value)
        monitorStates[id] = { monitor, value }
        if (record.mode === 'slider') {
          const slider = document.createElement('input')
          slider.type = 'range'
          slider.min = record.sliderMin
          slider.max = record.sliderMax
          slider.step = record.isDiscrete ? 1 : 0.01
          // Per #54, but it deviates from Scratch
          slider.tabIndex = -1
          slider.addEventListener('input', () => {
            getVariable(record.targetId, id).value = slider.value
          })
          slider.addEventListener('change', () => {
            getVariable(record.targetId, id).value = slider.value
          })
          monitorStates[id].slider = slider
          monitor.appendChild(slider)
        }
        monitorWrapper.appendChild(monitor)
      }
      monitorStates[id].monitor.style.display = record.visible ? null : 'none'
      if (record.visible) {
        let value = record.value
        if (typeof value === 'number') {
          value = Number(value.toFixed(6))
        }
        if (typeof value === 'boolean') {
          value = value.toString()
        }
        if (Array.isArray(value)) {
          if (monitorStates[id].lastValue === JSON.stringify(value)) return
          // TODO: Avoid recreating list items
          monitorStates[id].value.innerHTML = ''
          value.forEach(val => {
            const row = document.createElement('div')
            row.className = 'row'
            row.textContent = val
            monitorStates[id].value.appendChild(row)
          })
        } else {
          monitorStates[id].value.textContent = value
          if (monitorStates[id].slider) monitorStates[id].slider.value = value
        }
      }
    })
  })

  vm.postIOData('userData', { username: options.username })

  for (const url of options.extensions) {
    await vm.extensionManager.loadExtensionURL(url)
  }

  await vm.loadProject(
    options.assets.file
      ? await fetch(options.assets.file).then(r => r.arrayBuffer())
      : await storage.load(storage.AssetType.Project).then(asset => asset.data)
  )

  const cloudProvider = new CloudProvider(
    options.cloud.serverUrl,
    options.cloud.specialBehaviours
  )
  vm.setCloudProvider(cloudProvider)
  if (options.cloud.specialBehaviours || !options.cloud.serverUrl) {
    const stageVariables = vm.runtime.getTargetForStage().variables
    for (const { name, isCloud } of Object.values(stageVariables)) {
      if (isCloud) {
        if (
          options.cloud.specialBehaviours &&
          options.cloud.serverUrl &&
          !name.startsWith(CLOUD_PREFIX + 'local storage')
        ) {
          continue
        }
        const value = localStorage.getItem('[s3] ' + name)
        if (value !== null) {
          vm.postIOData('cloud', { varUpdate: { name, value } })
        }
      }
    }
  }
  if (options.cloud.specialBehaviours) {
    cloudProvider.handleUrlChange()
  }
  if (options.cloud.serverUrl) {
    openConnection()
  }

  progress.remove()
  const loadingImage = document.getElementById('loading-image')
  if (loadingImage) {
    loadingImage.remove()
  }
  document.body.classList.remove('loading')

  const greenFlag = document.getElementById('start-btn')
  const stopSign = document.getElementById('stop-btn')
  greenFlag.addEventListener('click', () => {
    greenFlag.blur()
    vm.greenFlag()
  })
  stopSign.addEventListener('click', () => {
    stopSign.blur()
    vm.stopAll()
  })
  vm.on('PROJECT_RUN_START', () => {
    document.body.classList.add('running')
    stopSign.disabled = false
  })
  vm.on('PROJECT_RUN_STOP', () => {
    document.body.classList.remove('running')
    stopSign.disabled = true
  })

  if (options.autoStart) {
    vm.greenFlag()
  }

  canvas.addEventListener('mousedown', handleMouseDown)
  canvas.addEventListener('touchstart', handleMouseDown, { passive: false })
}
