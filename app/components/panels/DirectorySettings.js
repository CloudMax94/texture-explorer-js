import React from 'react'
import { padStart } from 'lodash'

import ItemSettings from './ItemSettings'

class DirectorySettings extends ItemSettings {
  static dependencies = {
    actions: ['setItemData'],
    state: [
      'currentProfileId',
      ['selectedDirectory', 'item'],
      ['selectedDirectoryPath', 'path'],
      ['selectedDirectoryBaseAddress', 'baseAddress']
    ]
  }
  constructor (props) {
    super(props)
    this.sizeInput = React.createRef()
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.item && (!this.props.item || this.props.item.get('id') !== nextProps.item.get('id'))) {
      this.updateAddressField(nextProps.item.get('address'))
      this.updateOffsetField(nextProps.item.get('address') - nextProps.baseAddress)
      this.updateSizeField(nextProps.item)
    } else if (!nextProps.item && this.props.item) {
      this.addressInput.current.value = ''
      this.offsetInput.current.value = ''
      this.sizeInput.current.value = ''
    }
  }
  componentDidMount () {
    if (this.props.item) {
      this.updateAddressField(this.props.item.get('address'))
      this.updateOffsetField(this.props.item.get('address') - this.props.baseAddress)
      this.updateSizeField(this.props.item)
    }
  }
  handleSizeChange = (event) => {
    this.setData('length', parseInt(event.target.value))
  }
  updateSizeField = (item) => {
    if (item.get('id') !== 'root') {
      this.sizeInput.current.value = '0x' + padStart(item.get('length').toString(16), 8, 0).toUpperCase()
    } else {
      this.sizeInput.current.value = ''
    }
  }
  getExtraFields () {
    const { item } = this.props
    let disabled = !item
    let readOnly = item && item.get('id') === 'root'

    let extraFields = []

    extraFields[0] = (
      <div>
        <label htmlFor={this.id + '_size'}>Size: </label>
      </div>
    )
    extraFields[1] = (
      <div>
        <input id={this.id + '_size'} type='text' disabled={disabled} readOnly={readOnly} onChange={this.handleSizeChange} ref={this.sizeInput} />
      </div>
    )
    return extraFields
  }
}

export default DirectorySettings
