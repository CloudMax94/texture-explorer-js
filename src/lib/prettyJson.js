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

      if (Array.isArray(obj)) { // [...]
        let items = []
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
        // We separate objects since we want them to be printed last
        let objectItems = []
        let otherItems = []
        for (let key in obj) {
          let value = _stringify(obj[key], nextIndent)
          if (value !== undefined) {
            value = JSON.stringify(key) + ': ' + value
            if (typeof obj[key] === 'object') {
              objectItems.push(value)
            } else {
              otherItems.push(value)
            }
          }
        }
        if (objectItems.length || otherItems.length) {
          let items = [otherItems.join(', '), objectItems.join(',\n' + nextIndent)]
          // If there is an object we throw in a newline for the closing bracket
          return '{' +
            items.join(objectItems.length && otherItems.length ? ', ' : '') +
            (objectItems.length ? '\n' + currentIndent : '') +
          '}'
        }
      }
    }

    return string
  }(obj, ''))
}

export default prettyJSON
