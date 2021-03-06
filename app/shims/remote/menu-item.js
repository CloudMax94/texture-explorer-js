import { reject, uniq, map, find } from 'lodash'
class GlobalKeys {
  constructor () {
    this.keyBindings = []
    this.assignedKeys = []
    document.addEventListener('keydown', (event) => {
      this.triggerBinding(event)
    })
  }
  add (accelerator, callback) {
    var o = {
      callback: callback,
      shiftKey: false,
      cmdorctrlKey: false
    }
    var keys = accelerator.toLowerCase().split('+')
    if (keys.indexOf('shift') > -1) {
      o.shiftKey = true
    }
    if (keys.indexOf('cmdorctrl') > -1) {
      o.cmdorctrlKey = true
    }
    keys = reject(keys, function (v) {
      return v === 'shift' || v === 'cmdorctrl'
    })
    o.key = keys[0].toUpperCase()
    if (o.key.length === 1) {
      o.which = o.key.charCodeAt(0)
    } else {
      if (/^F[1-9][0-2]?$/.test(o.key)) {
        o.which = 111 + parseInt(o.key.substr(1))
      } else {
        o.which = null
      }
    }
    this.keyBindings.push(o)
    this.updateAssignedKeys()
    return o
  }
  updateAssignedKeys () {
    this.assignedKeys = uniq(map(this.keyBindings, 'which'))
  }
  getBinding (event) {
    if (this.assignedKeys.indexOf(event.which) === -1) {
      return
    }
    return find(this.keyBindings, {
      shiftKey: event.shiftKey,
      cmdorctrlKey: (event.metaKey || event.ctrlKey),
      which: event.which
    })
  }
  triggerBinding (event) {
    var binding = this.getBinding(event)
    if (binding) {
      if (binding.shiftKey && !binding.cmdorctrlKey) {
        // The binding uses shift, but not cmd or ctrl
        // So we need to check if user is currently typing
        let ele = document.activeElement
        if (ele.tagName === 'TEXTAREA' || (ele.tagName === 'INPUT' && (ele.type === 'text' || ele.type === 'number)'))) {
          // Make sure that the input isn't disabled or read-only
          if (!ele.disabled && !ele.readOnly) {
            // User is typing, do not trigger binding
            return
          }
        }
      }
      binding.callback(event)
    }
  }
  unbind (binding) {
    this.keyBindings.splice(this.keyBindings.indexOf(binding), 1)
    this.updateAssignedKeys()
  }
}

var globalKeys = new GlobalKeys()

export default class MenuItem {
  constructor (data) {
    this.type = data.type
    if (data.type && data.type === 'separator') {
      return
    }
    this.globalKeyObject = null
    this.label = data.label
    this.click = data.click
    this.enabled = data.enabled
    if (!('enabled' in data)) {
      this.enabled = true
    }
    if (data.accelerator) {
      this.accelerator = data.accelerator
    }
    if (data.submenu) {
      this.submenu = data.submenu
    }
  }

  set accelerator (data) {
    this._accelerator = data
    if (this.globalKeyObject) {
      globalKeys.unbind(this.globalKeyObject)
    }
    this.globalKeyObject = globalKeys.add(data, (event) => {
      event.preventDefault()
      if (this.enabled) {
        this.click(event)
      }
    })
  }

  get accelerator () {
    return this._accelerator
  }
}
