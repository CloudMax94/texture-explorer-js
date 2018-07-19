import React from 'react'
import { padStart, uniqueId } from 'lodash'

import ImmutablePureComponent from '../ImmutablePureComponent'

class ItemSettings extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.addressInput = React.createRef()
    this.offsetInput = React.createRef()
  }
  componentWillMount () {
    this.id = uniqueId('item_setting_')
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.item && (!this.props.item || this.props.item.get('id') !== nextProps.item.get('id'))) {
      this.updateAddressField(nextProps.item.get('address'))
      this.updateOffsetField(nextProps.item.get('address') - nextProps.baseAddress)
    } else if (!nextProps.item && this.props.item) {
      this.addressInput.current.value = ''
      this.offsetInput.current.value = ''
    }
  }
  componentDidMount () {
    if (this.props.item) {
      this.updateAddressField(this.props.item.get('address'))
      this.updateOffsetField(this.props.item.get('address') - this.props.baseAddress)
    }
  }
  setData (key, value) {
    this.props.setItemData(this.props.currentProfileId, this.props.item.get('id'), key, value)
  }
  handleNameChange = (event) => {
    this.setData('name', event.target.value)
  }
  handleAddressChange = (event) => {
    let val = parseInt(event.target.value)
    if (isNaN(val)) {
      return
    }
    this.setData('address', val)
    this.updateOffsetField(val - this.props.baseAddress)
  }
  handleOffsetChange = (event) => {
    let val = parseInt(event.target.value)
    if (isNaN(val)) {
      return
    }
    this.setData('offset', val)
    this.updateAddressField(this.props.baseAddress + val)
  }
  updateAddressField = (address) => {
    this.addressInput.current.value = '0x' + padStart(address.toString(16), 8, 0).toUpperCase()
  }
  updateOffsetField = (offset) => {
    this.offsetInput.current.value = (offset < 0 ? '-' : '') + '0x' + padStart(Math.abs(offset).toString(16), 8, 0).toUpperCase()
  }
  getExtraFields () {
    return [null, null]
  }
  render () {
    const { item, path } = this.props
    let disabled = !item
    let readOnly = item && item.get('id') === 'root'
    let name = item ? item.get('name') : ''
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
          <input id={this.id + '_address'} type='text' disabled={disabled} readOnly={readOnly} onChange={this.handleAddressChange} ref={this.addressInput} />
          <input id={this.id + '_offset'} type='text' disabled={disabled} readOnly={readOnly} onChange={this.handleOffsetChange} ref={this.offsetInput} />
          {extraFields[1]}
        </div>
      </div>
    )
  }
}

export default ItemSettings
