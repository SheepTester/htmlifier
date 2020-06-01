const extensionWorkerGet = /new\s+Worker\([^")]*"[^"]*(extension-worker(?:\.min)?\.js)"\)/

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project file.
 */
const getProjectUrl = ({ assetId }) => {
  const [id, otherPart] = assetId.split('.');
  const assetUrlParts = ['https://projects.scratch.mit.edu/', id];
  if (otherPart) assetUrlParts.push(otherPart);
  return assetUrlParts.join('');
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
 */
const getAssetUrl = ({ assetId, dataFormat }) => {
  return `https://cdn.assets.scratch.mit.edu/internalapi/asset/${assetId}.${dataFormat}/get/`;
};

class LoadingProgress {
    constructor (callback) {
        this.total = 0;
        this.complete = 0;
        this.callback = callback;
    }

    on (storage) {
        const _this = this;
        const _load = storage.webHelper.load;
        storage.webHelper.load = function (...args) {
            const result = _load.call(this, ...args);
            _this.total += 1;
            _this.callback(_this);
            result.then(asset => {
                _this.complete += 1;
                _this.callback(_this, asset);
            });
            return result;
        };
    }
}

/**
 * Run the benchmark with given parameters in the location's hash field or
 * using defaults.
 */
const runBenchmark = function (id, logProgress) {
  return new Promise(res => {
    // Lots of global variables to make debugging easier
    // Instantiate the VM.
    const vm = new window.NotVirtualMachine();

    const storage = new ScratchStorage(); /* global ScratchStorage */
    const AssetType = storage.AssetType;
    storage.addWebStore([AssetType.Project], getProjectUrl);
    storage.addWebStore([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], getAssetUrl);
    vm.attachStorage(storage);

    if (logProgress) new LoadingProgress(logProgress).on(storage);

    vm.downloadProjectId(id);

    vm.on('workspaceUpdate', () => {
        res(vm);
    });

    // Run threads
    vm.start();
  });
};

function removePercentSection(str, key) {
  /*
  performs the following on str:
  % key %
  this part (and other parts surrounded in a similar fashion) will be removed
  % /key %
  returns str with the parts removed
  */
  const startKey = `% ${key} %`;
  const endKey = `% /${key} %`;
  while (str.includes(startKey) && str.includes(endKey)) {
    str = str.slice(0, str.indexOf(startKey))
      + str.slice(str.indexOf(endKey) + endKey.length);
  }
  return str;
}
function getDataURL(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = rej
    reader.readAsDataURL(blob);
  });
}
function downloadAsHTML(projectSrc, {
  title = 'Project',
  username = 'griffpatch',
  customRatio = false,
  progressBar = true,
  fullscreen = true,
  log = console.log,
  monitorColour = null,
  cloudServer = false,
  projectId = null,
  noVM = false,
  width = 480,
  height = 360,
  extension = null,
  loadingImage = null,
  noLimits = false,
  pointerLock = false,
  stretch = false,
  noCursor = false
} = {}) {
  const modded = true
  // Otherwise, the modded NotVirtualMachine will not get width and height
  // and that messes up mouse things (see #7)
  customRatio = true
  function problemFetching (file) {
    return err => {
      console.error(err)
      log(`There was a problem fetching ${file} from the internet`, 'error')
      throw new Error('error logged')
    }
  }
  log('Getting project...', 'status');
  return Promise.all([
    // make preface variables
    (projectSrc.id
      ? runBenchmark(projectSrc.id, ({complete, total}, file) => {
        log(complete + '/' + total + (file ? ` (+ ${file.data.length / 1000} kB ${file.dataFormat})` : ''), 'progress')
      })
        .then(vm => {
          log('Creating .sb3 file...', 'status');
          return vm.saveProjectSb3()
        })
      : Promise.resolve(projectSrc.file))
      .then(async blob => {
        return `var FILE = ${JSON.stringify(await getDataURL(blob))},\n`
      }),

    // fetch scripts
    noVM
      ? ''
      : /* no-offline */ fetch(modded
        ? 'https://sheeptester.github.io/scratch-vm/16-9/vm.min.js'
        : 'https://sheeptester.github.io/scratch-vm/vm.min.js')
        .catch(problemFetching('the Scratch engine'))
        .then(r => r.text())
        /* /no-offline */
        // [offline-vm-src]
        .then(async vmCode => {
          if (extension) {
            const extensionWorkerMatch = vmCode.match(extensionWorkerGet)
            if (extensionWorkerMatch) {
              log('Getting extension worker', status)
              /* no-offline */
              const workerCode = await fetch('https://sheeptester.github.io/scratch-vm/16-9/' + extensionWorkerMatch[1])
                .catch(problemFetching('the extension worker'))
                .then(r => r.text())
              /* /no-offline */
              // [offline-extension-worker-src]
              log('Getting custom extension script', status)
              const extensionScript = await fetch(extension)
                .catch(problemFetching('the custom extension'))
                .then(r => {
                  if (r.ok) {
                    return r.text()
                  } else {
                    log(`Fetching the custom extension gave a ${r.status} error`, 'error')
                    throw new Error('error logged')
                  }
                })
              // https://stackoverflow.com/a/10372280
              const workerMaker = `new Worker(URL.createObjectURL(new Blob([${
                JSON.stringify(workerCode.replace(/importScripts\(\w+\)/, () => {
                  // So apparently object URLs created in the main thread can't be
                  // accessed by a web worker oof
                  return `importScripts(URL.createObjectURL(new Blob([${
                    JSON.stringify(extensionScript)
                  }], {type: 'application/javascript'})))`
                }))
              }], {type: 'application/javascript'})))`
              vmCode = vmCode.slice(0, extensionWorkerMatch.index) + workerMaker +
                vmCode.slice(extensionWorkerMatch.index + extensionWorkerMatch[0].length)
            }
          }
          log('Scratch engine ready.', 'status');
          // remove dumb </ script>s in comments
          return vmCode.replace('</scr' + 'ipt>', '');
        }),

    // fetch template
    fetch(
      /* no-offline */ './template.html' /* /no-offline */
      // [template]
    ).catch(problemFetching('the HTML template')).then(r => r.text()),

    // fetch image data for loading gif
    loadingImage
      ? getDataURL(loadingImage)
      : ''
  ]).then(([preface, scripts, template, loadingImageURL]) => {
    scripts = preface
      + `DESIRED_USERNAME = ${JSON.stringify(username)},\n`
      + `COMPAT = ${compatibility.checked},\nTURBO = ${turbo.checked},\n`
      + `PROJECT_ID = ${JSON.stringify(projectId)},\n`
      + `WIDTH = ${width},\nHEIGHT = ${height},\n`
      + `EXTENSION_URL = ${JSON.stringify(extension)},\n`
      + `GENERATED = ${Date.now()};\n`
      + scripts;
    if (!noVM) {
      template = removePercentSection(template, 'no-vm');
    }
    if (modded) template = removePercentSection(template, 'vanilla');
    else template = removePercentSection(template, 'modded');
    if (customRatio) template = removePercentSection(template, 'default-ratio');
    else template = removePercentSection(template, 'custom-ratio');
    if (!extension) template = removePercentSection(template, 'extension-url');
    if (!progressBar) template = removePercentSection(template, 'loading-progress');
    if (!loadingImage) template = removePercentSection(template, 'loading-image');
    if (!fullscreen) template = removePercentSection(template, 'fullscreen');
    if (monitorColour) template = template.replace(/\{COLOUR\}/g, () => monitorColour);
    else template = removePercentSection(template, 'monitor-colour');
    if (!noLimits) template = removePercentSection(template, 'limits');
    if (!pointerLock) template = removePercentSection(template, 'pointer-lock');
    if (stretch) template = removePercentSection(template, 'fit');
    else template = removePercentSection(template, 'stretch');
    if (!noCursor) template = removePercentSection(template, 'no-cursor');
    if (cloudServer) {
      template = removePercentSection(template, 'cloud-localstorage')
        .replace(/\{CLOUD_HOST\}/g, () => JSON.stringify(cloudServer));
    } else {
      template = removePercentSection(template, 'cloud-ws');
    }
    return template
      .replace(/% \/?[a-z0-9-]+ %/g, '')
      // .replace(/\s*\r?\n\s*/g, '')
      .replace(/\{TITLE\}/g, () => title)
      .replace(/\{HEIGHT\/WIDTH%\}/g, () => 100 * height / width)
      .replace(/\{WIDTH\/HEIGHT%\}/g, () => 100 * width / height)
      .replace(/\{PROJECT_RATIO\}/g, () => `${width}/${height}`)
      .replace(/\{LOADING_IMAGE\}/g, () => loadingImageURL.replace(/&/g, '&amp;').replace(/"/g, '&quot;'))
      .replace(/\{SCRIPTS\}/g, () => scripts);
  });
}
