import Htmlifier, { ProjectSource } from '../src/htmlifier.ts'
import { ConversionOptions } from './options.ts'

type LoggerWithError = (
  message: string,
  type: 'status' | 'progress' | 'error'
) => void

export const htmlify = (
  options: ConversionOptions,
  log?: LoggerWithError
): Promise<Blob | null> => {
  const htmlifier = new Htmlifier()
  let project: ProjectSource
  if (options['upload-mode'] === 'file') {
    if (!options.file) {
      return Promise.resolve(null)
    }
    project = {
      type: 'file',
      file: options.file
    }
  } else {
    project =
      options['upload-mode'] === 'url'
        ? { type: 'url', url: options['project-url'] }
        : { type: 'id', id: String(options.id) }
  }
  return htmlifier.htmlify(project, {
    zip: options.zip,
    includeVm: true,

    title: options.title,
    username: options.username,

    width: options.width,
    height: options.height,
    stretch: options.stretch === 'stage',

    autoStart: options.autostart,
    turbo: options.turbo,
    fps: options.fps,
    limits: options.limits,
    fencing: options.fencing,
    pointerLock: options['pointer-lock'],

    cursor:
      options.cursor === 'file'
        ? options['cursor-file']
        : options.cursor === 'none'
        ? 'hidden'
        : null,
    favicon: options['favicon-file'],
    backgroundImage: options['background-file'],

    extensions: options.extensions,
    injectedScripts: options.plugins,

    loading: {
      progressBar: options.progress ? options['progress-colour'] : null,
      image:
        options['loading-image'] === 'file'
          ? options['loading-image-file']
          : options['loading-image-url'],
      stretch: options.stretch !== 'none'
    },

    buttons: {
      startStop: options['start-stop-controls'],
      fullscreen: options.fullscreen,
      download: options['download-btn'],
      addSprite: options['add-sprite-btn']
    },

    monitors: {
      showContainer: !options['transparent-monitor'],
      valueBackground:
        options['monitor-value'] === 'colour'
          ? options['monitor-colour']
          : null,
      text: options['monitor-text']
    },

    cloud: {
      serverUrl:
        options['cloud-provider'] === 'ws' ? options['cloud-ws'] : null,
      specialBehaviours: options['special-cloud'],
      projectId: String(options.id)
    },

    log
  })
}
