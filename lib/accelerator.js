export function acceleratorToText (accelerator) {
  if (typeof accelerator !== 'string') {
    return
  }
  // Generic
  var special = {
    cmdorctrl: 'Ctrl',
    plus: '+',
    minus: '-'
  }
  var separator = '+'
  if (process.platform === 'darwin' || window.navigator.platform.toLowerCase().indexOf('mac') > -1) {
    special = {
      cmdorctrl: '⌘',
      cmd: '⌘',
      shift: '⇧',
      alt: '⌥',
      ctrl: '⌃',
      tab: '⇥',
      enter: '↩',
      space: '␣',
      escape: '⎋',
      plus: '+',
      minus: '-',
      up: '↑',
      down: '↓',
      left: '←',
      right: '→'
    }
    separator = ''
  }
  var keys = accelerator.split('+')
  for (var i in keys) {
    var key = keys[i].toLowerCase()
    if (key in special) {
      keys[i] = special[key]
    }
  }
  return keys.join(separator)
}
