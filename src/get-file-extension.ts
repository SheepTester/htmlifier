/**
 * Gets the file extension of the given file name.
 *
 * Examples:
 * - 'vm.min.js' -> '.js'
 * - 'init' -> ''
 */
export default function getFileExtension (nameOrFile: string | File): string {
  const fileName = typeof nameOrFile === 'string' ? nameOrFile : nameOrFile.name
  return fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : ''
}
