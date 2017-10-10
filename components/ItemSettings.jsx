import React from 'react'
import { padStart, uniqueId } from 'lodash'

import { getFormats, getFormat } from '../lib/textureManipulator'

import ImmutablePureComponent from './ImmutablePureComponent.jsx'

class ItemSettings extends ImmutablePureComponent {
  componentWillMount () {
    this.id = uniqueId('item_setting_')
  }
  setData (key, value) {
    this.props.setItemData(this.props.profileId, this.props.item.get('id'), key, value)
  }
  handleNameChange = (event) => {
    this.setData('name', event.target.value)
  }
  handleAddressChange = (event) => {
    this.setData('address', parseInt(event.target.value))
  }
  handleOffsetChange = (event) => {
    this.setData('offset', parseInt(event.target.value))
  }
  handleLengthChange = (event) => {
    this.setData('length', parseInt(event.target.value))
  }
  handleFormatChange = (event) => {
    this.setData('format', event.target.value)
  }
  handleHeightChange = (event) => {
    this.setData('height', parseInt(event.target.value))
  }
  handleWidthChange = (event) => {
    this.setData('width', parseInt(event.target.value))
  }
  handlePaletteChange = (event) => {
    this.setData('palette', parseInt(event.target.value))
  }
  render () {
    const { item } = this.props
    let extraLabels = null
    let extraInputs = null
    let disabled = !item || item.get('id') === 'root'
    if (this.props.type === 'directory') {
      let size = ''
      if (item) {
        size = '0x' + padStart(item.get('length').toString(16), 8, 0).toUpperCase()
      }
      extraLabels = (
        <div>
          <label htmlFor={this.id + '_size'}>Size: </label>
        </div>
      )
      extraInputs = (
        <div>
          <input id={this.id + '_size'} type='text' disabled={disabled} pattern='0x[a-fA-F0-9]+' value={size} onChange={this.handleLengthChange} />
        </div>
      )
    } else if (this.props.type === 'texture') {
      let hasPalette = false
      let formatName = ''
      let width = ''
      let height = ''
      let palette = ''
      if (item) {
        let format = getFormat(item.get('format'))
        hasPalette = format.hasPalette()
        formatName = format.name
        width = item.get('width')
        height = item.get('height')
        palette = '0x' + padStart(item.get('palette').toString(16), 8, 0).toUpperCase()
      }

      extraLabels = (
        <div>
          <label htmlFor={this.id + '_format'}>Format: </label>
          <label htmlFor={this.id + '_width'}>Width: </label>
          <label htmlFor={this.id + '_height'}>Height: </label>
          {hasPalette ? <label htmlFor={this.id + '_palette'}>Palette: </label> : null}
        </div>
      )

      let formatInput = (<select id={this.id + '_format'} disabled={disabled} value={formatName} onChange={this.handleFormatChange}>
        {!disabled ? getFormats().map((format) => {
          return <option key={format.id} value={format.name}>{format.name}</option>
        }) : null}
      </select>)

      extraInputs = (
        <div>
          {formatInput}
          <input id={this.id + '_width'} type='number' disabled={disabled} value={width} onChange={this.handleWidthChange} />
          <input id={this.id + '_height'} type='number' disabled={disabled} value={height} onChange={this.handleHeightChange} />
          {hasPalette ? <input id={this.id + '_palette'} type='text' pattern='0x[a-fA-F0-9]+' value={palette} onChange={this.handlePaletteChange} /> : null}
        </div>
      )
    } else {

    }
    let name = ''
    let offset = ''
    let address = ''
    if (item) {
      name = item.get('name')
      offset = (this.props.offset < 0 ? '-' : '') + '0x' + padStart(Math.abs(this.props.offset).toString(16), 8, 0).toUpperCase()
      address = '0x' + padStart(item.get('address').toString(16), 8, 0).toUpperCase()
    }
    return (
      <div className='inputs input-columns'>
        <div>
          <label htmlFor={this.id + '_name'}>Name: </label>
          <label htmlFor={this.id + '_address'}>Address: </label>
          <label htmlFor={this.id + '_offset'}>Offset: </label>
          {extraLabels}
        </div>
        <div>
          <input id={this.id + '_name'} type='text' disabled={disabled} value={name} onChange={this.handleNameChange} />
          <input id={this.id + '_address'} type='text' disabled={disabled} pattern='0x[a-fA-F0-9]+' value={address} onChange={this.handleAddressChange} />
          <input id={this.id + '_offset'} type='text' disabled={disabled} pattern='-?0x[a-fA-F0-9]+' value={offset} onChange={this.handleOffsetChange} />
          {extraInputs}
        </div>
      </div>
    )
  }
}

export default ItemSettings
