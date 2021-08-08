import { JSZip } from 'https://deno.land/x/jszip@0.10.0/mod.ts'
import { toBlob } from './ensure-ok.ts'
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
      /** A `Blob` object containing the project file data (.sb, .sb2, .sb3) */
      file: Blob
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
function getAssetHashesFromProjectJson (
  json: Sb2ProjectJson | Sb3ProjectJson
): Map<string, string> {
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
      assetHashes.set(
        baseLayerMD5,
        `${baseLayerID}.${baseLayerMD5.split('.')[1]}`
      )
    }
    for (const { md5, soundID } of json.sounds) {
      assetHashes.set(md5, `${soundID}.${md5.split('.')[1]}`)
    }
    for (const child of json.children) {
      if (child.costumes) {
        for (const { baseLayerMD5, baseLayerID } of child.costumes) {
          assetHashes.set(
            baseLayerMD5,
            `${baseLayerID}.${baseLayerMD5.split('.')[1]}`
          )
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
export async function getProject (
  source: ProjectSource,
  log: Logger
): Promise<ScratchProject> {
  if (source.type === 'id') {
    log('I shall start downloading the project from scratch.mit.edu.', 'status')
    const project = await fetch(
      `https://projects.scratch.mit.edu/${source.id}`
    ).then(toBlob)
    let json: Sb2ProjectJson | Sb3ProjectJson
    try {
      json = JSON.parse(await project.text())
    } catch {
      // Cannot parse as JSON, so it's probably a .sb file.
      log('I have obtained an .sb (Scratch 1.4) project', 'status')
      return {
        type: 'file',
        file: project
      }
    }

    const assetHashes = getAssetHashesFromProjectJson(json)
    const assets: Map<string, Blob> = new Map()
    let done = 0
    log(
      `I shall start downloading the project's assets (the costumes and sounds). (0/${assetHashes.size})`,
      'progress'
    )
    await Promise.all(
      Array.from(assetHashes.keys(), async hash => {
        const blob = await fetch(
          `https://assets.scratch.mit.edu/internalapi/asset/${hash}/get/`
        ).then(toBlob)
        assets.set(hash, blob)
        done++
        log(
          `Still getting the assets... (${done}/${assetHashes.size})`,
          'progress'
        )
      })
    )

    return {
      type: 'assets',
      project: json,
      assets
    }
  }

  let file: Blob
  if (source.type === 'url') {
    log('I shall start downloading the project file from the URL.', 'status')
    file = await fetch(source.url).then(toBlob)
  } else {
    file = source.file
  }

  try {
    log(
      'I shall try to unzip the project file; .sb2 and .sb3 files are just .zips.',
      'status'
    )
    const zip = await new JSZip().loadAsync(file)
    const projectJson = zip.file('project.json')
    if (!projectJson) {
      throw new Error(
        "There's no project.json in the project file. This probably means it's not a valid .sb2 or .sb3 file."
      )
    }
    const json = JSON.parse(await projectJson.async('text'))
    const assetHashes = getAssetHashesFromProjectJson(json)
    const assets: Map<string, Blob> = new Map()

    let done = 0
    log(
      `I shall extract the costumes and sounds from the file. (0/${assetHashes.size})`,
      'progress'
    )
    for (const [hash, fileName] of assetHashes) {
      const file = zip.file(fileName)
      if (file) {
        assets.set(hash, await file.async('blob'))
      } else {
        // Scratch 2.0 project file ID was -1, so will have to fetch from
        // assets.scratch.mit.edu. This shouldn't happen unless the project.json
        // was taken directly from projects.scratch.mit.edu rather than
        // downloaded from the editor.
        assets.set(
          hash,
          await fetch(
            `https://assets.scratch.mit.edu/internalapi/asset/${hash}/get/`
          ).then(toBlob)
        )
      }
      done++
      log(
        `Still extracting the assets... (${done}/${assetHashes.size})`,
        'progress'
      )
    }

    return {
      type: 'assets',
      project: json,
      assets
    }
  } catch {
    // Probably an .sb file or something
    log(
      "I can't get the project.json and assets (costumes and sounds) from the file. It's probably an .sb file. I'll just include the file directly in the HTML file.",
      'status'
    )
    return {
      type: 'file',
      file
    }
  }
}
