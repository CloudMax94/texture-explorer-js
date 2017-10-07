import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { padStart, uniqueId } from 'lodash'

import textureManipulator from '../lib/textureManipulator'

class ItemSettings extends React.Component {
  componentWillMount () {
    this.id = uniqueId('item_setting_')
  }
  render () {
    const { item, parentAddress } = this.props
    let extraLabels = null
    let extraInputs = null
    if (this.props.type === 'texture') {
      let hasPalette = false
      let formatName = ''
      let width = ''
      let height = ''
      let palette = ''
      if (item) {
        let format = textureManipulator.getFormat(item.get('format'))
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
      extraInputs = (
        <div>
          <input id={this.id + '_format'} type='text' readOnly value={formatName} />
          <input id={this.id + '_height'} type='number' readOnly value={height} />
          <input id={this.id + '_width'} type='number' readOnly value={width} />
          {hasPalette ? <input id={this.id + '_palette'} type='text' readOnly value={palette} /> : null}
        </div>
      )
    } else {

    }
    let name = ''
    let offset = ''
    let address = ''
    if (item) {
      name = item.get('name')
      offset = '0x' + padStart((item.get('address') - parentAddress).toString(16), 8, 0).toUpperCase()
      address = '0x' + padStart(item.get('address').toString(16), 8, 0).toUpperCase()
    }
    return (
      <div className='input-columns'>
        <div>
          <label htmlFor={this.id + '_name'}>Name: </label>
          <label htmlFor={this.id + '_offset'}>Offset: </label>
          <label htmlFor={this.id + '_address'}>Address: </label>
          {extraLabels}
        </div>
        <div>
          <input id={this.id + '_name'} type='text' readOnly value={name} />
          <input id={this.id + '_offset'} type='text' readOnly pattern='[a-fA-F\d]+' value={offset} />
          <input id={this.id + '_address'} type='text' readOnly pattern='[a-fA-F\d]+' value={address} />
          {extraInputs}
        </div>
      </div>
    )
  }
}

function mapStateToProps (state, ownProps) {
  let workspace = state.workspace.getIn(['workspaces', state.workspace.get('currentWorkspace')])
  let item
  let parentAddress = 0
  if (workspace) {
    let id
    if (ownProps.type === 'texture') {
      id = workspace.get('selectedTexture')
    } else {
      id = workspace.get('selectedDirectory')
    }
    if (id) {
      item = workspace.getIn(['items', id])
      let parentId = item.get('parentId')
      if (parentId) {
        parentAddress = workspace.getIn(['items', item.get('parentId'), 'address'])
      }
    }
  }
  return {
    item,
    parentAddress
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemSettings)
