import React from 'react'
import { padStart, uniqueId } from 'lodash'

import ImmutablePureComponent from '../ImmutablePureComponent'

class ItemSettings extends ImmutablePureComponent {
  componentWillMount () {
    this.id = uniqueId('item_setting_')
  }
  setData (key, value) {
    this.props.setItemData(this.props.currentProfileId, this.props.item.get('id'), key, value)
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
  getExtraFields () {
    return [null, null]
  }
  render () {
    const { item, path, offset } = this.props
    let disabled = !item
    let readOnly = item && item.get('id') === 'root'
    let name = ''
    let address = ''
    let offsetParsed = ''
    if (item) {
      name = item.get('name')
      address = '0x' + padStart(item.get('address').toString(16), 8, 0).toUpperCase()
      offsetParsed = (offset < 0 ? '-' : '') + '0x' + padStart(Math.abs(offset).toString(16), 8, 0).toUpperCase()
    }
    let extraFields = this.getExtraFields()
    return (
      <div className='inputs input-columns'>
        <div>
          <label htmlFor={this.id + '_path'}>Path: </label>
          <label htmlFor={this.id + '_name'}>Name: </label>
          <label htmlFor={this.id + '_address'}>Address: </label>
          <label htmlFor={this.id + '_offset'}>Offset: </label>
          {extraFields[0]}
        </div>
        <div>
          <input id={this.id + '_path'} type='text' disabled={disabled} readOnly value={path} />
          <input id={this.id + '_name'} type='text' disabled={disabled} readOnly={readOnly} value={name} onChange={this.handleNameChange} />
          <input id={this.id + '_address'} type='text' disabled={disabled} readOnly={readOnly} pattern='0x[a-fA-F0-9]+' value={address} onChange={this.handleAddressChange} />
          <input id={this.id + '_offset'} type='text' disabled={disabled} readOnly={readOnly} pattern='-?0x[a-fA-F0-9]+' value={offsetParsed} onChange={this.handleOffsetChange} />
          {extraFields[1]}
        </div>
      </div>
    )
  }
}

export default ItemSettings
