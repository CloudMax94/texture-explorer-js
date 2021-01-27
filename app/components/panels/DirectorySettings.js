import React from 'react'
import { padStart } from 'lodash'

import ItemSettings from './ItemSettings'
import HexSpinner from '../HexSpinner'

class DirectorySettings extends ItemSettings {
  static dependencies = {
    actions: ['setItemData'],
    state: [
      'currentProfileId',
      ['selectedDirectory', 'item'],
      ['selectedDirectoryPath', 'path'],
      ['selectedDirectoryBaseAddress', 'baseAddress'],
      ['currentWorkspaceSize', 'rootSize']
    ]
  }
  handleSizeChange = (value) => {
    this.setData('length', value)
  }
  getExtraFields () {
    const { item, rootSize } = this.props
    let disabled = !item
    let readOnly = item && item.get('id') === 'root'
    let extraFields = []
    if (item) {
      let size
      if (item.get('id') !== 'root') {
        size = item.get('length')
      } else {
        size = rootSize
      }
      extraFields[0] = (
        <label htmlFor={this.id + '_size'}>Size: </label>
      )
      extraFields[1] = (
        <HexSpinner id={this.id + '_size'} disabled={disabled} readOnly={readOnly} value={size} onChange={this.handleSizeChange} />
      )
    }
    return extraFields
  }
}

export default DirectorySettings
