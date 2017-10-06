// Based on https://github.com/lydell/json-stringify-pretty-compact

const stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g

function prettify (string) {
  return string.replace(stringOrChar, function (match, string) {
    return string ? match : match + ' '
  })
}

function prettyJSON (obj, indent) {
  indent = JSON.stringify([1], null, indent || 1).slice(2, -3)

  return (function _stringify (obj, currentIndent) {
    var string = JSON.stringify(obj)
    if (string === undefined) {
      return string
    }
    if (typeof obj === 'object' && obj !== null) {
      let nextIndent = currentIndent + indent
      let items = []

      if (Array.isArray(obj)) { // [...]
        for (let i = 0, l = obj.length; i < l; i++) {
          items.push(_stringify(obj[i], nextIndent))
        }
        if (items.length) {
          return [
            '[',
            indent + items.join(',\n' + nextIndent),
            ']'
          ].join('\n' + currentIndent)
        }
      } else { // {...}
        let containsObject = false
        for (let key in obj) {
          if (typeof obj[key] === 'object') {
            containsObject = true
            break
          }
        }
        if (!containsObject) { // Does not contain an object, prettify the entire object
          return prettify(string)
        }
        // We assume that all objects are placed last and put all items until the first object on the same line
        let firstObject = false
        let lastIsObject = false
        for (let key in obj) {
          lastIsObject = typeof obj[key] === 'object'
          if (!firstObject && typeof obj[key] === 'object') {
            firstObject = true
            items = [items.join(', ')]
          }
          let value = _stringify(obj[key], nextIndent)
          if (value !== undefined) {
            items.push(JSON.stringify(key) + ': ' + value)
          }
        }
        // if last item is an object, we need to throw in a newline for the closing bracket
        let suffix = ''
        if (lastIsObject) {
          suffix = '\n' + currentIndent
        }
        if (items.length) {
          return '{' + items.join(',\n' + nextIndent) + suffix + '}'
        }
      }
    }

    return string
  }(obj, ''))
}

export default prettyJSON
