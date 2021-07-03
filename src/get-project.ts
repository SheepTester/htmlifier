import JSZip from '../lib/jszip.ts'
import { Logger } from './htmlifier.ts'

/** A source of the Scratch project's project.json and assets */
export type ProjectSource =
  | {
      type: 'id'
      /** The project ID on scratch.mit.edu */
      id: string
    }
  | {
      type: 'file'
      /** A `File` object containing the project file data (.sb, .sb2, .sb3) */
      file: File
    }
  | {
      type: 'url'
      /** A URL to a project file hosted on a CORS-enabled web server */
      url: string
    }

type Sb2Sound = {
  md5: string
  soundID: number
}
type Sb2Costume = {
  baseLayerMD5: string
  baseLayerID: number
}
type Sb2ProjectJson = {
  sounds: Sb2Sound[]
  costumes: Sb2Costume[]
  children: (
    | {
        sounds: Sb2Sound[]
        costumes: Sb2Costume[]
      }
    | Record<string, never>
  )[]
  info: unknown
}

type Sb3ProjectJson = {
  meta: unknown
  targets: {
    costumes: {
      // `md5ext` also exists, but it's not required apparently
      assetId: string
      dataFormat: 'png' | 'svg' | 'jpeg' | 'jpg' | 'bmp' | 'gif'
    }[]
    sounds: {
      assetId: string
      dataFormat: 'wav' | 'wave' | 'mp3'
    }[]
  }[]
}

/** Returns a map of md5-extensions to the file name */
function getAssetHashesFromProjectJson (json: Sb2ProjectJson | Sb3ProjectJson): Map<string, string> {
  const assetHashes: Map<string, string> = new Map()
  if ('meta' in json) {
    for (const target of json.targets) {
      for (const { assetId, dataFormat } of target.costumes) {
        assetHashes.set(`${assetId}.${dataFormat}`, `${assetId}.${dataFormat}`)
      }
      for (const { assetId, dataFormat } of target.sounds) {
        assetHashes.set(`${assetId}.${dataFormat}`, `${assetId}.${dataFormat}`)
      }
    }
  } else if ('info' in json) {
    for (const { baseLayerMD5, baseLayerID } of json.costumes) {
      assetHashes.set(baseLayerMD5, `${baseLayerID}.${baseLayerMD5.split('.')[1]}`)
    }
    for (const { md5, soundID } of json.sounds) {
      assetHashes.set(md5, `${soundID}.${md5.split('.')[1]}`)
    }
    for (const child of json.children) {
      if (child.costumes) {
        for (const { baseLayerMD5, baseLayerID } of child.costumes) {
          assetHashes.set(baseLayerMD5, `${baseLayerID}.${baseLayerMD5.split('.')[1]}`)
        }
        for (const { md5, soundID } of child.sounds) {
          assetHashes.set(md5, `${soundID}.${md5.split('.')[1]}`)
        }
      }
    }
  } else {
    throw new Error('project.json appears to be neither from 2.0 or 3.0')
  }
  return assetHashes
}

/** The Scratch project files to be included in the HTMLified file */
export type ScratchProject =
  | {
      type: 'file'

      /** A project file (most likely .sb3) */
      file: Blob
    }
  | {
      type: 'assets'

      /** The project.json, parsed */
      project: unknown

      /**
       * A `Map` between md5 hashes (with file extensions) and the asset file.
       */
      assets: Map<string, Blob>
    }

/** Get the Scratch project file given a source */
export async function getProject (source: ProjectSource, log: Logger): Promise<ScratchProject> {
  if (source.type === 'id') {
    log('Getting project from scratch.mit.edu...', 'status')
    const project = await fetch(`https://projects.scratch.mit.edu/${source.id}`)
      .then(r => r.blob())
    let json: Sb2ProjectJson | Sb3ProjectJson
    try {
      json = JSON.parse(await project.text())
    } catch {
      // Cannot parse as JSON, so it's probably a .sb file.
      log('.sb project obtained', 'status')
      return {
        type: 'file',
        file: project,
      }
    }

    const assetHashes = getAssetHashesFromProjectJson(json)
    const assets: Map<string, Blob> = new Map()
    let done = 0
    log(`Fetching project assets... (0/${assetHashes.size})`, 'progress')
    await Promise.all(
      Array.from(
        assetHashes.keys(),
        async hash => {
          const blob = await fetch(`https://assets.scratch.mit.edu/internalapi/asset/${hash}/get/`)
            .then(r => r.blob())
          assets.set(hash, blob)
          done++
          log(`Fetching project assets... (${done}/${assetHashes.size})`, 'progress')
        }
      )
    )

    return {
      type: 'assets',
      project: json,
      assets,
    }
  }

  let file: Blob
  if (source.type === 'url') {
    log('Getting project file from URL...', 'status')
    file = await fetch(source.url)
      .then(r => r.blob())
  } else {
    file = source.file
  }

  try {
    log('Unzipping project file...', 'status')
    const zip = await JSZip.loadAsync(file)
    const projectJson = zip.file('project.json')
    if (!projectJson) {
      throw new Error('No project.json')
    }
    const json = JSON.parse(await projectJson.async('text'))
    const assetHashes = getAssetHashesFromProjectJson(json)
    const assets: Map<string, Blob> = new Map()

    let done = 0
    log(`Extracting project assets... (0/${assetHashes.size})`, 'progress')
    for (const [hash, fileName] of assetHashes) {
      const file = zip.file(fileName)
      if (!file) {
        throw new Error(`Cannot get ${fileName}`)
      }
      assets.set(hash, await file.async('blob'))
      done++
      log(`Extracting project assets... (${done}/${assetHashes.size})`, 'progress')
    }

    return {
      type: 'assets',
      project: json,
      assets,
    }
  } catch {
    // Probably an .sb file or something
    log('Couldn\'t extract project.json and assets from file, so will HTMLify as file.', 'status')
    return {
      type: 'file',
      file,
    }
  }
}
