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
      ['selectedDirectoryOffset', 'offset']
    ]
  }
  handleLengthChange = (event) => {
    this.setData('length', parseInt(event.target.value))
  }
  getExtraFields () {
    const { item } = this.props
    let disabled = !item
    let readOnly = item && item.get('id') === 'root'

    let extraFields = []
    let size = ''
    if (item && item.get('id') !== 'root') {
      size = '0x' + padStart(item.get('length').toString(16), 8, 0).toUpperCase()
    }

    extraFields[0] = (
      <div>
        <label htmlFor={this.id + '_size'}>Size: </label>
      </div>
    )
    extraFields[1] = (
      <div>
        <input id={this.id + '_size'} type='text' disabled={disabled} readOnly={readOnly} pattern='0x[a-fA-F0-9]+' value={size} onChange={this.handleLengthChange} />
      </div>
    )

    return extraFields
  }
}

export default DirectorySettings
