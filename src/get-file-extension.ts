/**
 * Gets the file extension of the given file name.
 *
 * Examples:
 * - 'vm.min.js' -> '.js'
 * - 'init' -> ''
 */
export default function getFileExtension (nameOrFile: string | File): string {
  const fileName = nameOrFile instanceof File ? nameOrFile.name : nameOrFile
  return fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : ''
}
