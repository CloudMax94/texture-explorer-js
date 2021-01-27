import React from 'react'
import { padStart } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { remote } from 'electron'
import { getFormat } from '@cloudmodding/texture-manipulator'
import { getItemPath } from '../utils/helpers'
import ImmutablePureComponent from './ImmutablePureComponent'

import { BLOB_UNSET } from '../constants/workspace'
import { updateItemBlob } from '../actions/workspace'

const { MenuItem, Menu } = remote

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

  handleContext = (event) => {
    const { item } = this.props

    event.preventDefault()
    event.stopPropagation()

    this.props.handleFocus(item)

    const menu = new Menu()

    menu.append(new MenuItem({
      label: item.get('type') === 'directory' ? 'Open' : 'Edit',
      click: () => {
        this.props.handleDoubleClick(item)
      }
    }))

    menu.append(new MenuItem({type: 'separator'}))

    menu.append(new MenuItem({
      label: 'Delete',
      click: () => {
        this.props.deleteItem(item.get('id'))
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }

  renderColumn = (data, i) => {
    const {item, blob} = this.props
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
  }

  render () {
    const { item, offset, focused, path } = this.props
    const columns = [
      path
    ]
    // Offset
    columns.push((offset < 0 ? '-' : '') + '0x' + padStart(Math.abs(offset).toString(16), 8, 0).toUpperCase())
    // Offset End
    let offsetEnd = ''
    let size = 0
    let format
    if (item.get('type') === 'texture') {
      format = getFormat(item.get('format'))
      size = item.get('width') * item.get('height') * format.bits / 8
    } else if (item.get('type') === 'directory') {
      size = item.get('length')
    }
    offsetEnd = offset + size
    columns.push((offsetEnd < 0 ? '-' : '') + '0x' + padStart(Math.abs(offsetEnd).toString(16), 8, 0).toUpperCase())
    // Address
    columns.push('0x' + padStart(item.get('address').toString(16), 8, 0).toUpperCase())
    if (item.get('type') === 'texture') {
      columns.push(
        '0x' + padStart((item.get('address') + size).toString(16), 8, 0).toUpperCase(),
        '0x' + padStart(size.toString(16), 6, 0).toUpperCase(),
        item.get('format'),
        item.get('width'),
        item.get('height')
      )
      if (format.hasPalette()) {
        columns.push('0x' + padStart(item.get('palette').toString(16), 8, 0).toUpperCase())
      }
    } else if (item.get('type') === 'directory') {
      columns.push(
        '0x' + padStart((item.get('address') + size).toString(16), 8, 0).toUpperCase(),
        '0x' + padStart(size.toString(16), 6, 0).toUpperCase()
      )
    }
    const classes = 'tree-item ' + (focused ? 'focused' : '')
    return (
      <div className={classes} onContextMenu={this.handleContext}>
        {columns.map(this.renderColumn)}
      </div>
    )
  }
}

function mapStateToProps (state, ownProps) {
  let itemId = ownProps.item.get('id')
  let workspaceId = state.workspace.get('currentWorkspace')
  let workspace = state.workspace.getIn(['workspaces', workspaceId])
  let items = state.profile.getIn(['profiles', workspace.get('profile'), 'items'])
  let parentAddress = items.getIn([ownProps.item.get('parentId'), 'address']) || 0
  let offset = ownProps.item.get('address') - parentAddress
  let path = getItemPath(items, itemId, items.getIn([workspace.get('selectedDirectory'), 'id']))

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
