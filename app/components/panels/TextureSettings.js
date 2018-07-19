import React from 'react'
import { padStart } from 'lodash'

import { getFormats, getFormat } from '@cloudmodding/texture-manipulator'

import ItemSettings from './ItemSettings'

class TextureSettings extends ItemSettings {
  static dependencies = {
    actions: ['setItemData'],
    state: [
      'currentProfileId',
      ['selectedTexture', 'item'],
      ['selectedTexturePath', 'path'],
      ['selectedTextureBaseAddress', 'baseAddress']
    ]
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
  getExtraFields () {
    const { item } = this.props

    let disabled = !item

    let hasPalette = false
    let formatName = ''
    let width = ''
    let height = ''
    let palette = ''
    let extraFields = []

    if (item) {
      let format = getFormat(item.get('format'))
      hasPalette = format.hasPalette()
      formatName = format.name
      width = item.get('width')
      height = item.get('height')
      palette = '0x' + padStart(item.get('palette').toString(16), 8, 0).toUpperCase()
    }

    extraFields[0] = (
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

    extraFields[1] = (
      <div>
        {formatInput}
        <input id={this.id + '_width'} type='number' disabled={disabled} value={width} onChange={this.handleWidthChange} />
        <input id={this.id + '_height'} type='number' disabled={disabled} value={height} onChange={this.handleHeightChange} />
        {hasPalette ? <input id={this.id + '_palette'} type='text' pattern='0x[a-fA-F0-9]+' value={palette} onChange={this.handlePaletteChange} /> : null}
      </div>
    )

    return extraFields
  }
}

export default TextureSettings
