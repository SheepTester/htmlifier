import { JSZip } from 'https://deno.land/x/jszip@0.10.0/mod.ts'
import { ProjectSource, getProject } from './get-project.ts'
import getDataUrl from './get-data-url.ts'
import getFileExtension from './get-file-extension.ts'
import { escapeCss, escapeHtml, escapeScript } from './escape.ts'
import {
  EXTENSION_WORKER_URL,
  extensionWorker as extensionWorkerSource,
  template,
  VM_URL,
  vm
} from './dependencies.ts'

/** A CSS colour */
type Colour = string

export type Logger = (
  message: string,
  type: 'status' | 'progress' | 'error'
) => void

/** Options for HTMLification */
type HtmlifyOptions = Partial<{
  /** Logging function to track the progress of HTMLification. */
  log: Logger

  /**
   * Whether to store the project.json, assets, and VM separately and bundle
   * them all up in a .zip file.
   */
  zip: boolean

  /** Whether to include the VM inside the HTML file. Default: true */
  includeVm: boolean

  /** The page title of the resulting HTML file. */
  title: string

  /**
   * The value of the username block; this can also be changed by setting `☁
   * username` with special cloud behaviours enabled.
   */
  username: string

  /** Width of stage. Default: 480. */
  width: number

  /** Height of stage. Default: 360. */
  height: number

  /** Whether the stage should be stretched to fill the screen. */
  stretch: boolean

  /** Whether to start the project automatically. Default: true. */
  autoStart: boolean

  /** Whether turbo mode is enabled. */
  turbo: boolean

  /** FPS of the project. Default: 30. */
  fps: number

  /**
   * Whether to enforce reasonable limits such as the maximum list length (on by
   * default in vanilla Scratch). Default: true.
   */
  limits: boolean

  /**
   * Whether sprite fencing is enabled to prevent sprites from going off
   * screen (on by default in vanilla Scratch). Default: true.
   */
  fencing: boolean

  /**
   * Whether to lock the cursor when the user clicks on the stage. The mouse x/y
   * blocks are set to the accumulative mouse position, so the `limits` option
   * should be `false` to allow it to extend beyond the stage.
   */
  pointerLock: boolean

  /**
   * A `File` containing an image to set the cursor to, or `'hidden'` to hide
   * the cursor, or `null` to use the default cursor.
   */
  cursor: File | 'hidden' | null

  /** A `File` containing the favicon image. */
  favicon: File | null

  /** A `File` containing the background image. */
  backgroundImage: File | null

  /**
   * List of URLs to the unofficial extensions that the project uses.
   *
   * @see https://github.com/LLK/scratch-vm/blob/develop/docs/extensions.md#types-of-extensions
   */
  extensions: string[]

  /**
   * Custom JavaScript code to add to the HTML.
   *
   * This is equivalent to "plugins" (a euphemism for userscript) in E羊icques.
   */
  injectedScripts: string

  /** Customisation options for the loading screen. */
  loading: Partial<{
    /** The colour of the loading progress bar or `null` for no progress bar */
    progressBar: Colour | null

    /**
     * An image to show while the project is loading. Either a `File`, a URL to
     * an image (not included inside the HTML file), or `null` for no image.
     */
    image: File | string | null

    /** Whether the loading image should be stretched to fill the screen. */
    stretch: boolean
  }>

  /** Customisation options for the buttons on the top right of the page. */
  buttons: Partial<{
    /** Whether to show start/stop buttons. */
    startStop: boolean

    /** Whether to show the fullscreen button. */
    fullscreen: boolean
  }>

  /** Customisation of monitor colours. */
  monitors: Partial<{
    /**
     * Background colour of the list and variable monitors; `null` for
     * translucent black. If `'none'`, then the monitors will just be the
     * variable name and value text. Default: null.
     */
    background: Colour | 'none' | null

    /** The text colour of the list and variable monitors. Default: `white`. */
    text: Colour
  }>

  /**
   * Control the behaviour of cloud variables when HTMLified. Cloud variables
   * are stored in localStorage by default.
   */
  cloud: Partial<{
    /**
     * The URL of the cloud server, starting with `ws://` or `wss://`. `null` to
     * not use a web server and instead store cloud variables in localStorage.
     * Default: null.
     */
    serverUrl: string | null

    /**
     * Whether to use special cloud variable behaviours for cloud variables of
     * certain names. Some of these special cloud variables interact with web
     * APIs when set by the project, or are automatically set with a value such
     * as the URL of the page.
     *
     * @see https://github.com/SheepTester/htmlifier/wiki/Special-cloud-behaviours
     */
    specialBehaviours: boolean

    /**
     * The project ID used to identify the project to the cloud server. Default:
     * `0`.
     */
    projectId: string
  }>
}>

/** Converts a project to HTML */
export default class Htmlifier {
  private async _createHtml (
    projectSource: ProjectSource,
    {
      log = () => {},
      zip: outputZip = false,
      includeVm = true,
      title = '',
      username = '',
      width = 480,
      height = 360,
      stretch: stretchStage = false,
      autoStart = true,
      turbo = false,
      fps = 30,
      limits = true,
      fencing = true,
      pointerLock = false,
      cursor = null,
      favicon = null,
      backgroundImage = null,
      extensions = [],
      injectedScripts = '',
      loading: {
        progressBar = null,
        image: loadingImage = null,
        stretch: stretchLoadingImage = false
      } = {},
      buttons: {
        startStop: startStopBtns = false,
        fullscreen: fullscreenBtns = false
      } = {},
      monitors: {
        background: monitorBackground = null,
        text: monitorText = 'white'
      } = {},
      cloud: {
        serverUrl = null,
        specialBehaviours = false,
        projectId = '0'
      } = {}
    }: HtmlifyOptions
  ): Promise<Blob> {
    const project = await getProject(projectSource, log)

    /** Files to externally include in the .zip file */
    const files: Map<string, Blob | string> = new Map()

    /**
     * Stores file in .zip if `outputZip` is enabled. Returns a URL (either a
     * replative path or a data URL) that can be fetched.
     */
    async function registerFile (
      fileName: string,
      file: Blob | string
    ): Promise<string> {
      if (outputZip) {
        files.set(fileName, file)
        return `./${fileName}`
      } else {
        return await getDataUrl(
          file instanceof Blob ? file : new Blob([file], { type: 'text/plain' })
        )
      }
    }

    /**
     * Object mapping from asset md5-extension to a fetchable URL. Can also be
     * `project` and `file`.
     */
    const assets: Record<string, string | unknown> = {}

    if (project.type === 'assets') {
      if (!outputZip) {
        log(
          'Since you wanted a single HTML file, I need to represent the costume and sound files as text. This will make them take up 33% more space.',
          'status'
        )
      }
      assets.project = await registerFile(
        'project.json',
        JSON.stringify(project.project)
      )
      for (const [md5Ext, file] of project.assets) {
        assets[md5Ext] = await registerFile(md5Ext, file)
      }
    } else {
      if (!outputZip) {
        log(
          'Since you wanted a single HTML file, I need to represent the project file as text. This will make it take up 33% more space.',
          'status'
        )
      }
      assets.file = await registerFile('project', project.file)
    }

    let extensionWorker: { url: string } | { script: string } = {
      url: EXTENSION_WORKER_URL
    }
    if (extensions.length > 0 && includeVm) {
      log(
        'I shall start downloading each extension script file from their URL.',
        'status'
      )
      const extensionScripts: Record<string, string> = {}
      for (const url of extensions) {
        extensionScripts[url] = outputZip
          ? await registerFile(
              'extension.worker.js',
              await fetch(url).then(r => r.blob())
            )
          : await fetch(url).then(r => r.text())
      }
      // Prepend an override on importScripts to map extension URLs to locally
      // stored ones
      const workerScript = [
        `const scripts = ${JSON.stringify(extensionScripts, null, '\t')}`,
        'const oldImportScripts = window.importScripts',
        outputZip
          ? 'window.importScripts = (...urls) => oldImportScripts(...urls.map(url => scripts[url] || url))'
          : 'window.importScripts = (...urls) => urls.forEach(url => scripts[url] ? eval(scripts[url]) : oldImportScripts(url))',
        extensionWorkerSource
      ].join('\n')
      extensionWorker = outputZip
        ? { url: await registerFile('extension.worker.js', workerScript) }
        : { script: workerScript }
    }

    log('Now, I shall join everything together into an HTML file.', 'status')

    let html = template
    const classes: string[] = []
    const styles: string[] = []
    const bodyStyles: string[] = []

    html = html.replace('{TITLE}', () => escapeHtml(title))
    if (stretchStage) {
      classes.push('stretch-stage')
      html = html.replace('{WRAPPER_CSS}', '')
    } else {
      styles.push(
        `#wrapper { width: 100vw; height: ${(height / width) * 100}vw; }`,
        `@media (min-aspect-ratio: ${width}/${height}) {`,
        `#wrapper { height: 100vh; width: ${(width / height) * 100}vh; }`,
        '}'
      )
    }
    if (cursor === 'hidden') {
      classes.push('no-cursor')
    } else if (cursor) {
      const cursorUrl = await registerFile(
        'cursor' + getFileExtension(cursor),
        cursor
      )
      bodyStyles.push(`cursor: url("${escapeCss(cursorUrl)}"), auto;`)
    }
    if (favicon) {
      const faviconUrl = await registerFile(
        'favicon' + getFileExtension(favicon),
        favicon
      )
      html = html.replace(
        '{FAVICON}',
        () =>
          `<link rel="shortcut icon" type="image/png" href="${escapeHtml(
            faviconUrl
          )}">`
      )
    } else {
      html = html.replace('{FAVICON}', '')
    }
    if (backgroundImage) {
      const imageUrl = await registerFile(
        'favicon' + getFileExtension(backgroundImage),
        backgroundImage
      )
      // The background image is added separately to be loaded after the loading
      // image
      html = html.replace(
        '{BACKGROUND_CSS}',
        `<style>\nbody {\nbackground-image: url("${escapeCss(
          imageUrl
        )}");\n}\n</style>`
      )
    } else {
      html = html.replace('{BACKGROUND_CSS}', '')
    }
    if (progressBar) {
      classes.push('show-loading-progress')
      styles.push(
        '#loading-progress {',
        `border: 1px solid ${progressBar};`,
        '}',
        '#loading-progress::before {',
        `color: ${progressBar};`,
        '}',
        '#loading-progress::after',
        `background-color: ${progressBar};`,
        '}'
      )
    }
    if (loadingImage) {
      const imageUrl =
        loadingImage instanceof File
          ? await registerFile(
              'loading' + getFileExtension(loadingImage),
              loadingImage
            )
          : loadingImage
      html = html.replace(
        '{LOADING_IMAGE}',
        () => `<img src="${escapeHtml(imageUrl)}" id="loading-image">`
      )
    } else {
      html = html.replace('{LOADING_IMAGE}', '')
    }
    if (stretchLoadingImage) {
      classes.push('stretch-loading-image')
    }
    if (fullscreenBtns) {
      classes.push('show-fullscreen-btn')
    }
    if (startStopBtns) {
      classes.push('show-start-stop-btns')
    }
    if (monitorBackground === null || monitorBackground !== 'none') {
      classes.push('show-monitor-box')
      if (monitorBackground) {
        styles.push(
          '.custom-monitor-colour .default .monitor-value,',
          '.custom-monitor-colour .slider .monitor-value,',
          '.custom-monitor-colour .large,',
          '.custom-monitor-colour .row {',
          `background-color: ${monitorBackground};`,
          '}'
        )
      }
    }
    styles.push('.monitor {', `color: ${monitorText};`, '}')

    styles.push('body {', ...bodyStyles, '}')
    html = html
      .replace('{CLASSES}', () => classes.join(' '))
      .replace('{STYLES}', () =>
        styles.length > 0 ? `<style>\n${styles.join('\n')}\n</style>` : ''
      )
      .replace(
        '{DATA}',
        () =>
          `<script>\nconst GENERATED = ${Date.now()}\nconst initOptions = ${escapeScript(
            JSON.stringify(
              {
                width,
                height,
                stretchStage,
                fps,
                turbo,
                limits,
                fencing,
                pointerLock,
                autoStart,
                username,
                loadingProgress: !!progressBar,
                cloud: { serverUrl, specialBehaviours, projectId },
                extensionWorker,
                extensions,
                assets
              },
              null,
              '\t'
            )
          )}\ninit(initOptions)\n</script>` +
          (injectedScripts.length > 0
            ? `\n<script>\n${injectedScripts}\n</script>`
            : '')
      )
    if (!includeVm) {
      html = html.replace('{VM}', () => `<script src="${VM_URL}"></script>`)
    } else if (outputZip) {
      files.set('vm.js', vm)
      html = html.replace('{VM}', () => '<script src="./vm.js"></script>')
    } else {
      html = html.replace(
        '{VM}',
        () => `<script>\n${escapeScript(vm)}\n</script>`
      )
    }

    if (outputZip) {
      log(
        'I shall zip all the files into a ZIP file, as you requested.',
        'status'
      )
      const zip = new JSZip()
      for (const [fileName, file] of files) {
        zip.addFile(
          fileName,
          typeof file === 'string'
            ? file
            : new Uint8Array(await file.arrayBuffer())
        )
      }
      zip.addFile('index.html', html)
      zip.addFile(
        'README.txt',
        "You can't just open the index.html directly in the browser, unfortunately. Read https://github.com/SheepTester/htmlifier/wiki/Downloading-as-a-.zip\n"
      )
      return await zip.generateAsync({ type: 'blob' })
    } else {
      return new Blob([html], { type: 'text/html' })
    }
  }

  async htmlify (
    project: ProjectSource,
    options: HtmlifyOptions = {}
  ): Promise<Blob> {
    return await this._createHtml(project, options)
  }
}
