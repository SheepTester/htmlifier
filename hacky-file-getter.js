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
        this._load = null;
        this._storage = null;
    }

    on (storage) {
        const _this = this;
        this._load = storage.webHelper.load;
        storage.webHelper.load = function (...args) {
            const result = _this._load.call(this, ...args);
            _this.total += 1;
            _this.callback(_this);
            result.then(asset => {
                _this.complete += 1;
                _this.callback(_this, asset);
            });
            return result;
        };
        this._storage = storage;
    }

    off () {
        if (this._storage) {
            this._storage.webHelper.load = this._load;
        }
    }
}

// Basically vm.downloadProjectId except it actually returns the promise
function downloadProjectId (vm, storage, id) {
  return storage.load(storage.AssetType.Project, id)
    .then(projectAsset => vm.loadProject(projectAsset.data));
}

// Based on https://github.com/LLK/scratch-vm/blob/develop/src/serialization/serialize-assets.js
const serializeAssets = function (runtime, assetType) {
    const targets = runtime.targets;
    const assetDescs = [];
    for (let i = 0; i < targets.length; i++) {
        const currTarget = targets[i];
        const currAssets = currTarget.sprite[assetType];
        for (let j = 0; j < currAssets.length; j++) {
            const currAsset = currAssets[j];
            const asset = currAsset.asset;
            assetDescs.push({
                fileName: `${asset.assetId}.${asset.dataFormat}`,
                fileContent: asset.data});
        }
    }
    return assetDescs;
};
const getAssets = runtime => [
  ...serializeAssets(runtime, 'sounds'),
  ...serializeAssets(runtime, 'costumes')
];

const vm = new window.NotVirtualMachine();
const storage = new ScratchStorage(); /* global ScratchStorage */
window.Scratch = { vm, storage };

const AssetType = storage.AssetType;
storage.addWebStore([AssetType.Project], getProjectUrl);
storage.addWebStore([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], getAssetUrl);
vm.attachStorage(storage);

// Run threads
vm.start();

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
    reader.onload = e => reader.result
      ? res(reader.result)
      : rej(new Error('File might be too large (could not generate a data URI of the file). Try generating a .zip instead?'));
    reader.onerror = rej
    reader.readAsDataURL(blob);
  });
}
function downloadAsHTML(projectSrc, {
  title = 'Project',
  username = 'griffpatch',
  customRatio = false,
  progressBarColour = null,
  fullscreen = true,
  log = console.log,
  monitorColour = null,
  cloudServer = false,
  specialCloud = false,
  projectId = null,
  noVM = false,
  width = 480,
  height = 360,
  extension = null,
  loadingImage = null,
  noLimits = false,
  pointerLock = false,
  stretch = 'none',
  noCursor = false,
  zip: outputZip = false,
  monitorText = 'white',
  transparentMonitors = false,
  compatibilityMode = true,
  turboMode = false,
  favicon = null,
  backgroundImage = null,
  autoStart = true,
  showStartStop = false,
  cursor = null,
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
  const loadingProgress = new LoadingProgress(({complete, total}, file) => {
    log(complete + '/' + total + (file ? ` (+ ${file.data.length / 1000} kB ${file.dataFormat})` : ''), 'progress')
  });
  loadingProgress.on(storage);
  let zip
  return Promise.all([
    // make preface variables
    projectSrc.id
      ? storage.load(storage.AssetType.Project, projectSrc.id)
        .then(async ({ data: projectAsset }) => {
          log('Loading project...', 'status');
          await vm.loadProject(projectAsset);
          if (outputZip) {
            zip = await JSZip.loadAsync(Scratch.vm.saveProjectSb3())
            return 'var TYPE = "zip",\n';
          } else {
            log('Getting data URIs...', 'status');
            const preface = `var TYPE = 'json',\nPROJECT_JSON = ${
              JSON.stringify(await getDataURL(new Blob([projectAsset])))
            },\nASSETS = ${
              JSON.stringify(Object.fromEntries(await Promise.all(getAssets(vm.runtime)
                .map(async ({ fileName, fileContent }) => [
                  fileName,
                  await getDataURL(new Blob([fileContent]))
                ]))), null, 2)
            },\n`;
            return preface;
          }
        })
      : Promise.resolve(
        projectSrc.url
          ? fetch(projectSrc.url).then(r => r.blob())
          : projectSrc.file
      )
        .then(async blob => {
          if (outputZip) {
            zip = await JSZip.loadAsync(blob)
            return 'var TYPE = "zip",\n';
          } else {
            return `var TYPE = 'file',\nFILE = ${JSON.stringify(await getDataURL(blob))},\n`;
          }
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
              log('Getting extension worker', 'status')
              /* no-offline */
              const workerCode = await fetch('https://sheeptester.github.io/scratch-vm/16-9/' + extensionWorkerMatch[1])
                .catch(problemFetching('the extension worker'))
                .then(r => r.text())
              /* /no-offline */
              // [offline-extension-worker-src]
              log('Getting custom extension script', 'status')
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
      ? (typeof loadingImage === 'string'
        ? loadingImage
        : getDataURL(loadingImage))
      : '',
    favicon
      ? getDataURL(favicon)
      : '',
    backgroundImage
      ? getDataURL(backgroundImage)
      : '',
    cursor
      ? getDataURL(cursor)
      : ''
  ]).then(([preface, scripts, template, loadingImageURL, faviconURL, backgroundImageURL, cursorURL]) => {
    scripts = preface
      + `DESIRED_USERNAME = ${JSON.stringify(username)},\n`
      + `COMPAT = ${compatibilityMode},\nTURBO = ${turboMode},\n`
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
    if (progressBarColour) template = template.replace(/\{PROGRESS_COLOUR\}/g, () => progressBarColour);
    else template = removePercentSection(template, 'loading-progress');
    if (!loadingImage) template = removePercentSection(template, 'loading-image');
    if (!fullscreen) template = removePercentSection(template, 'fullscreen');
    if (monitorColour) template = template.replace(/\{COLOUR\}/g, () => monitorColour);
    else template = removePercentSection(template, 'monitor-colour');
    if (!noLimits) template = removePercentSection(template, 'limits');
    if (!pointerLock) template = removePercentSection(template, 'pointer-lock');
    if (stretch === 'stage') template = removePercentSection(template, 'fit');
    else template = removePercentSection(template, 'stretch');
    if (stretch !== 'loading-image') template = removePercentSection(template, 'stretch-loading-image');
    if (!noCursor) template = removePercentSection(template, 'no-cursor');
    if (!specialCloud) {
      template = removePercentSection(template, 'special-cloud');
    }
    if (cloudServer) {
      if (!specialCloud) {
        template = removePercentSection(template, 'cloud-localstorage');
      }
      template = removePercentSection(template, 'cloud-localstorage-provider')
        .replace(/\{CLOUD_HOST\}/g, () => JSON.stringify(cloudServer));
    } else {
      template = removePercentSection(template, 'cloud-ws')
        .replace(/\{CLOUD_HOST\}/g, 'null');
    }
    if (transparentMonitors) template = removePercentSection(template, 'monitor-box');
    if (!favicon) template = removePercentSection(template, 'favicon');
    if (!backgroundImage) template = removePercentSection(template, 'background-image');
    if (!autoStart) template = removePercentSection(template, 'autostart');
    if (!showStartStop) template = removePercentSection(template, 'start-stop');
    if (!cursor) template = removePercentSection(template, 'cursor');
    const html = template
      .replace(/% \/?[a-z0-9-]+ %/g, '')
      // .replace(/\s*\r?\n\s*/g, '')
      .replace(/\{TITLE\}/g, () => title)
      .replace(/\{HEIGHT\/WIDTH%\}/g, () => 100 * height / width)
      .replace(/\{WIDTH\/HEIGHT%\}/g, () => 100 * width / height)
      .replace(/\{PROJECT_RATIO\}/g, () => `${width}/${height}`)
      .replace(/\{MONITOR_TEXT\}/g, () => monitorText)
      .replace(/\{LOADING_IMAGE\}/g, () => loadingImageURL.replace(/&/g, '&amp;').replace(/"/g, '&quot;'))
      .replace(/\{FAVICON\}/g, () => faviconURL.replace(/&/g, '&amp;').replace(/"/g, '&quot;'))
      .replace(/\{BACKGROUND\}/g, () => JSON.stringify(backgroundImageURL))
      .replace(/\{CURSOR\}/g, () => JSON.stringify(cursorURL))
      .replace(/\{SCRIPTS\}/g, () => scripts);
    if (outputZip) {
      zip.file('index.html', html);
      log('Generating .zip file...', 'status');
      return zip.generateAsync({
        type: 'blob',
        // Same as VirtualMachine#saveProjectSb3
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
    } else {
      return new Blob([html], { type: 'text/html' });
    }
  }).finally(() => {
    loadingProgress.off(); // Stop tracking scratch-storage
  });
}
