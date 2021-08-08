export const defaultStringOptions = {
  'project-url': '',

  // # Options
  title: 'Scratch 3.0 is here!',
  username: 'ScratchCat',
  'progress-colour': '#00ffff',
  'loading-image-url': '',

  // ## Monitor style
  'monitor-colour': '#ff8c1a',
  'monitor-text': '#ffffff',

  // ## Cloud variable source
  'cloud-ws': ''
}
export type StringOptions = typeof defaultStringOptions
export const stringKeys = Object.keys(
  defaultStringOptions
) as (keyof StringOptions)[]

export const defaultNumberOptions = {
  id: 276660763,

  // # Options
  fps: 30,

  // ## E羊icques (modded) options
  width: 480,
  height: 360
}
export type NumberOptions = typeof defaultNumberOptions
export const numberKeys = Object.keys(
  defaultNumberOptions
) as (keyof NumberOptions)[]

export const defaultBooleanOptions = {
  // TODO
  // 'include-file': true,

  // # Options
  turbo: false,
  progress: true,
  autostart: true,
  fullscreen: true,
  'start-stop-controls': false,
  'download-btn': false,
  'add-sprite-btn': false,
  zip: false,

  // ## Mouse pointers
  'pointer-lock': false,

  // ## Monitor style
  'transparent-monitor': false,

  // ## Cloud variable source
  'special-cloud': false,

  // ## E羊icques (modded) options
  limits: true,
  fencing: true,

  autodownload: true
}
export type BooleanOptions = typeof defaultBooleanOptions
export const booleanKeys = Object.keys(
  defaultBooleanOptions
) as (keyof BooleanOptions)[]

export type FileOptions = {
  file: File | null

  // # Options
  'favicon-file': File | null
  'background-file': File | null
  'loading-image-file': File | null

  // ## Mouse pointers
  'cursor-file': File | null
}
export const defaultFileOptions: FileOptions = {
  file: null,

  'favicon-file': null,
  'background-file': null,
  'loading-image-file': null,
  'cursor-file': null
}
export const fileKeys = Object.keys(defaultFileOptions) as (keyof FileOptions)[]

export const radioValues = {
  'upload-mode': ['id', 'file', 'url'],
  'loading-image': ['file', 'url'],

  // # Options
  stretch: ['stage', 'loading-image', 'none'],

  // ## Mouse pointers
  cursor: ['default', 'none', 'file'],

  // ## Monitor style
  'monitor-value': ['translucent', 'colour'],

  // ## Cloud variable source
  'cloud-provider': ['localstorage', 'ws']
} as const
export type RadioOptions = {
  [key in keyof typeof radioValues]: typeof radioValues[key][number]
}
export const defaultRadioOptions: RadioOptions = {
  'upload-mode': 'id',

  'loading-image': 'file',
  stretch: 'none',

  cursor: 'default',

  'monitor-value': 'translucent',

  'cloud-provider': 'localstorage'
}
export const radioKeys = Object.keys(
  defaultRadioOptions
) as (keyof RadioOptions)[]

const empty: (string | File)[] = []
export const defaultListOptions = {
  extensions: empty,
  plugins: empty
}
export type ListOptions = typeof defaultListOptions
export const listKeys = Object.keys(defaultListOptions) as (keyof ListOptions)[]

export type ConversionOptions = StringOptions &
  NumberOptions &
  BooleanOptions &
  FileOptions &
  RadioOptions &
  ListOptions
export const defaultOptions: ConversionOptions = {
  ...defaultStringOptions,
  ...defaultNumberOptions,
  ...defaultBooleanOptions,
  ...defaultFileOptions,
  ...defaultRadioOptions,
  ...defaultListOptions
}
export const keys = Object.keys(defaultOptions) as (keyof ConversionOptions)[]

export type OnOptionChange = <K extends keyof ConversionOptions>(
  option: K,
  value: ConversionOptions[K]
) => void
