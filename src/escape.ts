const htmlEscapes: Record<string, string> = {
  '&': 'amp',
  '<': 'lt',
  '>': 'gt',
  '"': 'quot'
}

/**
 * Escapes a minimal set of characters using HTML entities. This doesn't escape
 * single quotes, so if you include this inside an attribute, use double quotes.
 */
export function escapeHtml (string: string): string {
  return string.replace(/[&<>"]/g, char => `&${htmlEscapes[char]};`)
}

/**
 * Serialises the given string. This merely escapes some control characters, the
 * double quote ("), and the backslash. This means you'll have to include this
 * inside a double-quoted CSS string, not a single-quoted one.
 *
 * Example:
 *
 * ```ts
 * `url("${escapeCss(url)}")`
 * ```
 *
 * @see https://drafts.csswg.org/cssom/#serialize-a-string
 */
export function escapeCss (string: string): string {
  // deno-lint-ignore no-control-regex
  return string.replace(/[\0\x01-\x1f\x7f"\\]/g, char => {
    if (char === '\0') {
      return '\ufffd'
    } else if (char === '"' || char === '\\') {
      return '\\' + char
    } else {
      const codePoint = char.codePointAt(0)
      if (!codePoint) throw new Error('Why is code point undefined')
      return `\\${codePoint.toString(16)} `
    }
  })
}

/** Escapes `</script>` to safely insert a string inside a script tag */
export function escapeScript (string: string): string {
  return string.replace(/<\/script>/g, '<\\/script>')
}
