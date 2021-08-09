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
import { toBlob, toText } from './ensure-ok.ts'

export type { ProjectSource } from './get-project.ts'

/** A CSS colour */
export type Colour = string

export type Logger = (message: string, type: 'status' | 'progress') => void

/**
 * Options customising the screen that shows while the project is
 * loading.
 */
export interface LoadingOptions {
  /** The colour of the loading progress bar or `null` for no progress bar */
  progressBar: Colour | null

  /**
   * An image to show while the project is loading. Either a `File`, a URL to
   * an image (not included inside the HTML file), or `null` for no image.
   */
  image: File | string | null

  /** Whether the loading image should be stretched to fill the screen. */
  stretch: boolean
}

/**
 * Options for toggling which buttons are shown in the top-right corner of the
 * resulting HTML file.
 */
export interface ButtonOptions {
  /** Whether to show start/stop buttons. */
  startStop: boolean

  /** Whether to show the fullscreen button. */
  fullscreen: boolean

  /**
   * Whether to show a button that downloads the project's current state as an
   * .sb3. Apparently this is useful for some kinds of projects where they want
   * you to remix the project to save the game state or add your own thing to
   * the project.
   */
  download: boolean

  /**
   * Whether to show a button that lets you add a sprite by selecting a
   * .sprite3/.sprite2 file.
   *
   * Apparently, this can be used for an OS project to add a custom app, where
   * each app is contained within a sprite.
   */
  addSprite: boolean
}

/**
 * Options customising the design of variable and list monitors.
 *
 * Note that by default, unlike Scratch, monitors are translucent black with
 * white text because dark theme is cool. I assume a common use of the HTMLifier
 * is to publish projects on other websites like itch.io, and because of the
 * negative stigma around Scratch being for beginners to programming, I think it
 * could be helpful to make it less obvious that a project was made in Scratch.
 */
export interface MonitorOptions {
  /**
   * Whether to show the container box surrounding the monitor. In Scratch,
   * this is normally shown in light grey, but in HTMLified projects it is
   * translucent black. Default: true.
   */
  showContainer: boolean

  /**
   * Background colour of the monitor value. This includes the orange boxes
   * around the variable value and red boxes around list item values. If
   * `null`, then a translucent black will be used.
   *
   * If `valueBackground` is `null` and `showContainer` is `false`, then only
   * the monitor text will be shown.
   */
  valueBackground: Colour | null

  /**
   * The text colour of the monitors' labels and values. Default: `white`.
   */
  text: Colour
}

/**
 * Options defining how cloud variables are stored.
 */
export interface CloudOptions {
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
   * `0`. Not needed if `serverUrl` is `null`.
   */
  projectId: string
}

/** Options to customise the resulting converted HTML file. */
export interface HtmlifyOptions {
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
   * List of URLs or JavaScript files containing the unofficial extensions that
   * the project uses.
   *
   * @see
   * https://github.com/LLK/scratch-vm/blob/develop/docs/extensions.md#types-of-extensions
   */
  extensions: (string | File)[]

  /**
   * List of URLs or JavaScript files to include in the resulting HTML file. In
   * addition to having access to DOM APIs (as opposed to unofficial extensions,
   * which are sandboxed in a Web Worker), the resulting HTML file also makes
   * the following variables global:
   *
   * - `vm` has the instance of Scratch's `VirtualMachine`
   * - `setCloud(name, value)` sets a cloud variable with the name `name`
   *   (including the ☁) to `value`
   *
   * These injected scripts are equivalent to E羊icques "plugins," which are a
   * euphemism for userscripts.
   */
  injectedScripts: (string | File)[]

  /** Customisation options for the loading screen. */
  loading: Partial<LoadingOptions>

  /** Customisation options for the buttons on the top right of the page. */
  buttons: Partial<ButtonOptions>

  /** Customisation of list and variable monitor colours. */
  monitors: Partial<MonitorOptions>

  /**
   * Control the behaviour of cloud variables when HTMLified. Cloud variables
   * are stored in localStorage by default.
   */
  cloud: Partial<CloudOptions>
}

/**
 * A "converter" that "converts" a project to HTML.
 *
 * I put "convert" in scare quotes because there's really no conversion going
 * on. It just stuffs the Scratch VM and the project data into a single HTML
 * file that makes the Scratch VM run the project. It's no different than a
 * self-contained embed of the Scratch project player.
 *
 * However, to the common Scratcher, this isn't a big concern. They just want to
 * see the `.sb3` file extension get turned into a `.html` that can be previewed
 * immediately in the browser. That is "conversion" enough for them.
 *
 * I often see Scratchers asking how to convert from an .sb3 file to some other
 * language, like JavaScript, Python, or Java. But this is inherently flawed;
 * programming languages alone aren't required to be able to render graphics or
 * play sound. @apple502j said it well:
 *
 * > The whole idea of "converting something into another language" is flawed.
 * > Just like how cultural difference affects translation of real-life
 * > languages, there are big differences that make this idea very hard to
 * > implement. For example, JavaScript itself does not offer stage rendering,
 * > so you'll have to add a few hundreds of kilobytes of code just to make that
 * > cat appear.
 *
 * The TurboWarp Packager has a more accurate and descriptive name, at the cost
 * of not being what the common Scratcher would be thinking of when they want to
 * turn their Scratch project into a web page. In contrast, the HTMLifier is
 * somewhat deceptive, considering that similar existing programs (e.g.
 * Phosphorus) actually do convert Scratch blocks into JavaScript. The HTMLifier
 * can be seen as a joke, [originally made as a lazy solution to vague
 * demands](https://scratch.mit.edu/discuss/post/3432236/).
 *
 * Anyways, here's an example.
 *
 * ```ts
 * // Converts "Scratch 3.0 is here!" https://scratch.mit.edu/projects/276660763/
 * const result = await new Htmlifier()
 *   .htmlify({ type: 'id', id: '276660763' })
 *   .then(blob => blob.text())
 * ```
 */
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
      injectedScripts = [],
      loading: {
        progressBar = null,
        image: loadingImage = null,
        stretch: stretchLoadingImage = false
      } = {},
      buttons: {
        startStop: startStopBtns = false,
        fullscreen: fullscreenBtn = false,
        download: downloadBtn = false,
        addSprite: addSpriteBtn = false
      } = {},
      monitors: {
        showContainer = true,
        valueBackground = null,
        text: monitorText = 'white'
      } = {},
      cloud: {
        serverUrl = null,
        specialBehaviours = false,
        projectId = '0'
      } = {}
    }: Partial<HtmlifyOptions>
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
        fileName = fileName.replace(/[^a-z0-9. _\-,()]|^[ .]+|[ ]+$/gi, '_')
        while (files.has(fileName)) {
          fileName = 'another ' + fileName
        }
        files.set(fileName, file)
        return `./${fileName}`
      } else {
        return await getDataUrl(
          typeof file === 'string'
            ? new Blob([file], { type: 'text/plain' })
            : file
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
    if (extensions.length > 0) {
      log(
        'I shall start downloading each extension script file from their URL.',
        'status'
      )
      const extensionScripts: string[] = []
      for (const extensionSource of extensions) {
        if (typeof extensionSource !== 'string') {
          extensionScripts.push(
            outputZip
              ? await registerFile(
                  extensionSource.name,
                  await extensionSource.text()
                )
              : await extensionSource.text()
          )
        } else if (includeVm) {
          extensionScripts.push(
            outputZip
              ? await registerFile(
                  extensionSource + '.js',
                  await fetch(extensionSource).then(toBlob)
                )
              : await fetch(extensionSource).then(toText)
          )
        }
      }
      if (includeVm) {
        // Prepend an override on importScripts to map extension URLs to locally
        // stored ones
        const workerScript = [
          `const scripts = ${JSON.stringify(extensionScripts, null, '\t')}`,
          'const oldImportScripts = self.importScripts',
          // Fallback to URL import in case the extension importScripts some other
          // URL
          outputZip
            ? 'self.importScripts = (...urls) => oldImportScripts(...urls.map(url => scripts[url] || url))'
            : 'self.importScripts = (...urls) => urls.forEach(url => scripts[url] ? eval(scripts[url]) : oldImportScripts(url))',
          extensionWorkerSource
        ].join('\n')
        extensionWorker = outputZip
          ? { url: await registerFile('extension-worker.js', workerScript) }
          : { script: workerScript }
      }
    }

    type Script =
      | { type: 'url'; url: string }
      | { type: 'inline'; source: string }
    const injectedJs: Script[] = []
    if (injectedScripts.length > 0) {
      log(
        'I shall start downloading each script file from their URL.',
        'status'
      )
      for (const source of injectedScripts) {
        if (outputZip) {
          injectedJs.push({
            type: 'url',
            url:
              typeof source === 'string'
                ? await registerFile(
                    source + '.js',
                    await fetch(source).then(toBlob)
                  )
                : await registerFile(source.name, await source.text())
          })
        } else {
          injectedJs.push({
            type: 'inline',
            source:
              typeof source === 'string'
                ? await fetch(source).then(toText)
                : await source.text()
          })
        }
      }
    }

    log('Now, I shall join everything together into an HTML file.', 'status')

    let html = template
    const classes: string[] = []
    const styles: string[] = []

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
      styles.push(
        'body {',
        `cursor: url("${escapeCss(cursorUrl)}"), auto;`,
        '}'
      )
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
        '#loading-progress::after {',
        `background-color: ${progressBar};`,
        '}'
      )
    }
    if (loadingImage) {
      const imageUrl =
        typeof loadingImage === 'string'
          ? loadingImage
          : await registerFile(
              'loading' + getFileExtension(loadingImage),
              loadingImage
            )
      html = html.replace(
        '{LOADING_IMAGE}',
        () => `<img src="${escapeHtml(imageUrl)}" id="loading-image">`
      )
    } else {
      html = html.replace('{LOADING_IMAGE}', '')
    }

    if (stretchLoadingImage) classes.push('stretch-loading-image')
    if (startStopBtns) classes.push('show-start-stop-btns')
    if (fullscreenBtn) classes.push('show-fullscreen-btn')
    if (downloadBtn) classes.push('show-download-btn')
    if (addSpriteBtn) classes.push('show-add-sprite-btn')
    if (showContainer) classes.push('show-monitor-box')

    if (valueBackground) {
      // This class is mainly to overcome selector precedence because
      // .show-monitor-box .large has greater precedence over .large
      classes.push('custom-monitor-colour')
      styles.push(
        '.custom-monitor-colour .default .monitor-value,',
        '.custom-monitor-colour .slider .monitor-value,',
        '.custom-monitor-colour .large,',
        '.custom-monitor-colour .row-value {',
        `background-color: ${valueBackground};`,
        '}'
      )
    }
    styles.push('.monitor {', `color: ${monitorText};`, '}')

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
                extensionCount: extensions.length,
                assets
              },
              null,
              '\t'
            )
          )}\ninit(initOptions)\n</script>${injectedJs
            .map(script =>
              script.type === 'inline'
                ? `<script>\n${script.source}\n</script>`
                : `<script src="${script.url}"></script>`
            )
            .join('\n')}`
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

  /**
   * Convert `project` to HTML. Returns a `Blob` containing the HTML file, or a
   * ZIP file if the `zip` option was enabled.
   */
  async htmlify (
    project: ProjectSource,
    options: Partial<HtmlifyOptions> = {}
  ): Promise<Blob> {
    return await this._createHtml(project, options)
  }
}
