import React from 'react'
import { padStart } from 'lodash'

import ImmutablePureComponent from './ImmutablePureComponent'

function formatHex (value, len = 8) {
  let prefix = '0x'
  if (value < 0) {
    value = Math.abs(value)
    prefix = '-' + prefix
  }
  return prefix + padStart(value.toString(16), len, 0).toUpperCase()
}

class HexSpinner extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.internalValue = null
    this.inputRef = React.createRef()
  }
  componentDidMount () {
    if (Number.isInteger(this.props.value)) {
      this.setValue(this.props.value, false)
    }
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.value !== this.internalValue) {
      this.setValue(nextProps.value, false)
    }
  }
  handleChange = (event) => {
    let value = 0
    let str = event.target.value.trim()
    if (str !== '') {
      let multiplier = 1
      // NOTE: isNaN does not handle negative hex
      if (str.substr(0, 3) === '-0x') {
        str = str.substr(1)
        multiplier = -1 // Makes the result value negative
      }
      if (str === '' || isNaN(str)) {
        value = this.internalValue
      } else {
        value = parseInt(str) * multiplier
      }
    }
    this.internalValue = value
    this.props.onChange(value)
  }
  setValue = (value, triggerChange = true) => {
    if (!Number.isInteger(value)) {
      value = null
    }
    this.internalValue = value
    if (value === null) {
      this.inputRef.current.value = ''
    } else {
      this.inputRef.current.value = formatHex(value)
    }
    if (triggerChange) {
      this.props.onChange(value)
    }
  }
  isDisabled = () => {
    return this.props.disabled || this.props.readOnly
  }
  handleKeyDown = (event) => {
    if (this.isDisabled()) {
      return
    }
    let multiplier = 0x01
    if (event.shiftKey) {
      multiplier = 0x10
    }
    switch (event.which) {
      case 38: // Up Arrow
        this.setValue((this.internalValue || 0) + 0x01 * multiplier)
        event.preventDefault()
        break
      case 40: // Down Arrow
        this.setValue((this.internalValue || 0) - 0x01 * multiplier)
        event.preventDefault()
        break
      case 33: // Page Up
        this.setValue((this.internalValue || 0) + 0x100 * multiplier)
        event.preventDefault()
        break
      case 34: // Page Down
        this.setValue((this.internalValue || 0) - 0x100 * multiplier)
        event.preventDefault()
        break
    }
  }
  handleWheel = (event) => {
    if (this.isDisabled()) {
      return
    }
    if (document.activeElement !== this.inputRef.current) {
      return
    }
    let multiplier = 0x01
    if (event.shiftKey) {
      multiplier = 0x10
    }
    if (event.deltaY > 0) {
      multiplier *= -1
    }
    this.setValue((this.internalValue || 0) + 0x01 * multiplier)
    event.preventDefault()
  }
  handleClick = (event, modifier) => {
    if (this.isDisabled()) {
      return
    }
    event.preventDefault()
    this.setValue((this.internalValue || 0) + modifier * (event.shiftKey ? 0x10 : 1))
  }
  handleClickUp = (event) => {
    this.handleClick(event, 1)
  }
  handleClickDown = (event) => {
    this.handleClick(event, -1)
  }
  handleBlur = (event) => {
    let ele = this.inputRef.current
    let str = ele.value.trim()
    // NOTE: isNaN does not handle negative hex, so we remove it during validation
    if (str.substr(0, 3) === '-0x') {
      str = str.substr(1)
    }
    if (str === '' || isNaN(str)) {
      ele.value = formatHex(this.props.value)
    }
  }
  render () {
    const {id, disabled, readOnly} = this.props
    return (
      <div className='input-spinner-wrap' onWheel={this.handleWheel}>
        <input id={id} type='text' disabled={disabled} readOnly={readOnly} onChange={this.handleChange} ref={this.inputRef} onKeyDown={this.handleKeyDown} onBlur={this.handleBlur} placeholder={this.props.value !== undefined && this.props.value !== null ? '0x00000000' : null} />
        <div className='input-spinner'>
          <div onMouseDown={this.handleClickUp} />
          <div onMouseDown={this.handleClickDown} />
        </div>
      </div>
    )
  }
}

export default HexSpinner
