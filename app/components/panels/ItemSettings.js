import React from 'react'
import { padStart, uniqueId } from 'lodash'

import ImmutablePureComponent from '../ImmutablePureComponent'
import HexSpinner from '../HexSpinner'

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
  handleAddressChange = (value) => {
    this.setData('address', value)
  }
  handleOffsetChange = (value) => {
    this.setData('offset', value)
  }
  getExtraFields () {
    return [null, null]
  }
  render () {
    const { item, path, baseAddress } = this.props
    let disabled = !item
    let readOnly = item && item.get('id') === 'root'
    let name = ''
    let address
    let offset
    if (item) {
      name = item.get('name')
      address = item.get('address')
      offset = address - baseAddress
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
          <HexSpinner id={this.id + '_address'} disabled={disabled} readOnly={readOnly} value={address} onChange={this.handleAddressChange} ref={this.addressInput} />
          <HexSpinner id={this.id + '_offset'} disabled={disabled} readOnly={readOnly} value={offset} onChange={this.handleOffsetChange} ref={this.offsetInput} />
          {extraFields[1]}
        </div>
      </div>
    )
  }
}

export default ItemSettings
