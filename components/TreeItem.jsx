import React from 'react'
import { padStart } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import textureManipulator from '../lib/textureManipulator'
import { getItemPath } from '../lib/helpers'
import ImmutablePureComponent from './ImmutablePureComponent.jsx'

import { BLOB_UNSET } from '../constants/workspace'
import { updateItemBlob } from '../actions/workspace'

class TreeItem extends ImmutablePureComponent {
  componentWillMount () {
    this.blobUpdate(this.props)
  }

  componentWillReceiveProps (nextProps) {
    this.blobUpdate(nextProps)
  }

  blobUpdate (props) {
    const { item, workspaceId, updateItemBlob, blobState } = props
    if (item) {
      if (blobState === BLOB_UNSET) {
        updateItemBlob(item.get('id'), workspaceId)
      }
    }
  }

  handleDoubleClick = (event) => {
    event.preventDefault()
    this.props.handleDoubleClick(this.props.item)
  }

  handleClick = (event) => {
    event.preventDefault()
    this.props.handleFocus(this.props.item)
  }

  render () {
    const { item, offset, focused, path, blob } = this.props
    const columns = [
      path
    ]
    columns.push(...[
      (offset < 0 ? '-' : '') + '0x' + padStart(Math.abs(offset).toString(16), 8, 0).toUpperCase(),
      '0x' + padStart(item.get('address').toString(16), 8, 0).toUpperCase()
    ])
    if (item.get('type') === 'texture') {
      const size = item.get('width') * item.get('height') * textureManipulator.getFormat(item.get('format')).sizeModifier()
      columns.push(...[
        '0x' + padStart((item.get('address') + size).toString(16), 8, 0).toUpperCase(),
        '0x' + padStart(size.toString(16), 6, 0).toUpperCase(),
        item.get('format'),
        item.get('width'),
        item.get('height')
      ])
      if (textureManipulator.getFormat(item.get('format')).hasPalette()) {
        columns.push('0x' + padStart(item.get('palette').toString(16), 8, 0).toUpperCase())
      }
    } else if (item.get('type') === 'directory') {
      columns.push(...[
        '0x' + padStart((item.get('address') + item.get('length')).toString(16), 8, 0).toUpperCase(),
        '0x' + padStart(item.get('length').toString(16), 6, 0).toUpperCase()
      ])
    }
    const classes = 'tree-item ' + (focused ? 'focused' : '')
    return (
      <div className={classes} ref={(ele) => { this.ele = ele }}>
        {columns.map((data, i) => {
          let icon = null
          if (i === 0) {
            if (item.get('type') === 'directory') {
              icon = <i className='tree-icon icon'>file_directory</i>
            } else if (item.get('type') === 'texture') {
              if (blob) {
                icon = <i className='tree-icon' style={{backgroundImage: 'url(' + blob + ')'}}>&nbsp;</i>
              } else {
                icon = <i className='tree-icon icon'>file_media</i>
              }
            }
          }
          return (
            <div key={i} className='tree-col' onClick={this.handleClick} onDoubleClick={this.handleDoubleClick}>{icon}{data}</div>
          )
        })}
      </div>
    )
  }
}

function mapStateToProps (state, ownProps) {
  let itemId = ownProps.item.get('id')
  let workspaceId = state.workspace.get('currentWorkspace')
  let workspace = state.workspace.getIn(['workspaces', workspaceId])
  let profile = state.profile.getIn(['profiles', workspace.get('profile')])
  let parentAddress = profile.getIn(['items', ownProps.item.get('parentId'), 'address']) || 0
  let offset = ownProps.item.get('address') - parentAddress
  let path = getItemPath(profile, itemId, profile.getIn(['items', workspace.get('selectedDirectory'), 'id']))
  let blob = workspace.getIn(['blobs', itemId, 'blob'])
  let blobState = workspace.getIn(['blobs', itemId, 'blobState']) || BLOB_UNSET
  return {
    offset,
    path,
    workspaceId,
    blob,
    blobState
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    updateItemBlob
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(TreeItem)
