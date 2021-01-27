import React from 'react'
import { padStart } from 'lodash'

import { getFormats, getFormat } from '@cloudmodding/texture-manipulator'

import ItemSettings from './ItemSettings'
import HexSpinner from '../HexSpinner'

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
  handlePaletteChange = (value) => {
    this.setData('palette', value)
  }
  handlePaletteOffsetChange = (value) => {
    this.setData('palette', value + this.props.baseAddress)
  }
  renderFormat = (format) => (
    <option key={format.id} value={format.name}>{format.name}</option>
  )
  getExtraFields () {
    const { item, baseAddress } = this.props

    let disabled = !item

    let hasPalette = false
    let formatName = ''
    let width = ''
    let height = ''
    let extraFields = []

    if (item) {
      let format = getFormat(item.get('format'))
      hasPalette = format.hasPalette()
      formatName = format.name
      width = item.get('width')
      height = item.get('height')
    }

    extraFields[0] = [
      <label key='format' htmlFor={this.id + '_format'}>Format: </label>,
      <label key='width' htmlFor={this.id + '_width'}>Width: </label>,
      <label key='height' htmlFor={this.id + '_height'}>Height: </label>
    ]

    let formatInput = (
      <select key='format' id={this.id + '_format'} disabled={disabled} value={formatName} onChange={this.handleFormatChange}>
        {!disabled ? getFormats().map(this.renderFormat) : null}
      </select>
    )

    extraFields[1] = [
      formatInput,
      <input key='width' id={this.id + '_width'} type='number' disabled={disabled} value={width} onChange={this.handleWidthChange} />,
      <input key='height' id={this.id + '_height'} type='number' disabled={disabled} value={height} onChange={this.handleHeightChange} />
    ]

    if (hasPalette) {
      let palette = item.get('palette')
      let paletteOffset = item.get('palette') - baseAddress

      extraFields[0].push(<label key='palette'>Palette</label>)
      extraFields[1].push(<label key='palette' className='input'><hr /></label>)

      extraFields[0].push(<label key='palette_address' htmlFor={this.id + '_palette'}>Address: </label>)
      extraFields[1].push(<HexSpinner key='palette_address' id={this.id + '_palette'} value={palette} onChange={this.handlePaletteChange} />)

      extraFields[0].push(<label key='palette_offset' htmlFor={this.id + '_palette_offset'}>Offset: </label>)
      extraFields[1].push(<HexSpinner key='palette_offset' id={this.id + '_palette_offset'} value={paletteOffset} onChange={this.handlePaletteOffsetChange} />)

      extraFields[0].push(<label key='palette_format' htmlFor={this.id + '_palette_format'}>Format: </label>)
      extraFields[1].push(<select key='palette_format' id={this.id + '_palette_format'} disabled value='rgb5a1'>
        <option value='ia16'>ia16</option>
        <option value='rgb5a1'>rgb5a1</option>
      </select>)
    }

    return extraFields
  }
}

export default TextureSettings
