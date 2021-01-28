import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  deleteWorkspace,
  setCurrentWorkspace,
  setCurrentDirectory,
  setCurrentTexture,
  downloadItem
} from '../actions/workspace'
import {
  moveItem,
  deleteItem,
  copyItemToClipboard,
  addItemObject
} from '../actions/profile'
import { setTreeSize } from '../actions/interface'
import { getItemPath } from '../utils/helpers'
import { remote } from 'electron'

import ImmutablePureComponent from './ImmutablePureComponent'
import TreeView from './TreeView'

class WorkspaceTab extends ImmutablePureComponent {
  handleClick = (event) => {
    this.props.onClick(this.props.workspaceId)
  }
  handleCloseClick = (event) => {
    event.stopPropagation()
    this.props.onClose(this.props.workspaceId)
  }
  render () {
    const classes = [
      'workspace-tab'
    ]
    if (this.props.selected) {
      classes.push('selected')
    }
    return (
      <div className={classes.join(' ')} onClick={this.handleClick}>
        <span className='btnText'>{this.props.children}</span>
        <span className='closeBtn' onClick={this.handleCloseClick}>x</span>
      </div>
    )
  }
}

class Workspace extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {
      'search': ''
    }
    this.searchbar = React.createRef()
  }

  componentDidMount () {
    document.addEventListener('keydown', this.handleSearchHotkey)
  }

  componentWillUnmount () {
    document.removeEventListener('keydown', this.handleSearchHotkey)
  }

  handleSearchHotkey = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.which === 70) {
      event.preventDefault()
      this.searchbar.current.focus()
    }
  }

  handleTabClick = (workspaceId) => {
    this.props.setCurrentWorkspace(workspaceId)
  }

  handleCloseClick = (workspaceId) => {
    this.props.deleteWorkspace(workspaceId)
  }

  handleSearch = (event) => {
    this.setState({search: event.target.value})
  }

  filterChildren = (item) => {
    return item.get('parentId') === this.props.selectedDirectory
  }

  mapTabs = (workspace, i) => (
    <WorkspaceTab key={i} selected={workspace.get('id') === this.props.currentWorkspace} workspaceId={workspace.get('id')} onClick={this.handleTabClick} onClose={this.handleCloseClick}>
      {workspace.get('name')}
    </WorkspaceTab>
  )

  render () {
    const {
      workspaces,
      sizes,
      profileId,
      items,
      selectedDirectory,
      selectedTexture,
      setCurrentDirectory,
      setCurrentTexture,
      moveItem,
      deleteItem,
      downloadItem,
      addItemObject,
      copyItemToClipboard,
      setTreeSize,
      settings
    } = this.props

    const tabs = workspaces.toList().map(this.mapTabs)
    let filteredItems = null
    if (items && selectedDirectory) {
      let search = this.state.search.toLowerCase()
      if (search.length) {
        let parts = search.split(' ')
        let formats = []
        let types = []
        let filteredSearch = []
        for (let i = 0; i < parts.length; i++) {
          let part = parts[i]
          let filterPos = part.indexOf('=')
          if (filterPos > 0) {
            let filter = part.slice(0, filterPos)
            let value = part.slice(filterPos + 1)
            if (filter === 'format') {
              formats.push(...value.split(','))
            } else if (filter === 'type') {
              types.push(...value.split(','))
            } else {
              filteredSearch.push(part)
            }
          } else {
            filteredSearch.push(part)
          }
        }
        filteredSearch = filteredSearch.join(' ')
        filteredItems = items.toList().filter(item => {
          if (formats.length && !formats.includes(item.get('format'))) {
            return false
          }
          if (types.length && !types.includes(item.get('type'))) {
            return false
          }
          let searchString
          if (settings.get('includePathInSearch') === true) {
            searchString = getItemPath(items, item.get('id'), 0)
          } else {
            searchString = item.get('name')
          }
          if (searchString.toLowerCase().indexOf(filteredSearch) > -1) {
            let parentId = item.get('parentId')
            while (parentId) {
              if (parentId === selectedDirectory) {
                return true
              }
              parentId = items.getIn([parentId, 'parentId'])
            }
          }
          return false
        })
      } else {
        filteredItems = items.toList().filter(this.filterChildren)
      }
    }
    let content = []
    if (selectedDirectory) {
      content.push(
        <div key='tree' className='workspace-content'>
          <TreeView
            sizes={sizes}
            profileId={profileId}
            items={filteredItems}
            directoryId={selectedDirectory}
            textureId={selectedTexture}
            setCurrentDirectory={setCurrentDirectory}
            setCurrentTexture={setCurrentTexture}
            setTreeSize={setTreeSize}
            moveItem={moveItem}
            deleteItem={deleteItem}
            downloadItem={downloadItem}
            addItemObject={addItemObject}
            copyItemToClipboard={copyItemToClipboard}
            doubleClickSelect={settings.get('doubleClickSelect') === true}
          />
        </div>,
        <div key='search' className='search-bar'>
          <input ref={this.searchbar} type='text' disabled={!selectedDirectory} placeholder='Search...' onChange={this.handleSearch} />
        </div>
      )
    } else {
      content.push(
        <div key='welcome' className='workspace-content'>
          <div className='welcome'>
            <div className='welcome-title'>Welcome to Texture Explorer.js {remote.app.getVersion()}</div>
            <div>Profiles are not included with the program, they can be downloaded <a href='https://github.com/CloudMax94/texture-explorer-profiles' target='_blank'>here</a>.</div>
            <div>After opening a file, you can import profiles with the Profile Manager.</div>
            <br />
            <div>You can download textures by dragging them from the Texture Viewer.</div>
            <div>You can import textures by dropping them on the Texture Viewer.<br />Make sure that the height and width matches when importing a texture.</div>
            <div>To import textures with palettes, you must use Indexed PNGs.</div>
            <div>Note that ci4 and ci8 doesn't support ia16 palettes at the moment.</div>
            <br />
            <div>N64 ROMs are byte-swapped to big-endian when loaded, and stay as big-endian when saved.</div>
            <div>They also use the ID and Version from the ROM header as File Key, instead of filename.</div>
          </div>
        </div>
      )
    }
    return (
      <div className='workspace'>
        <div className='workspace-tabs'>
          {tabs}
        </div>
        {content}
      </div>
    )
  }
}

function mapStateToProps (state) {
  let currentWorkspace = state.workspace.get('currentWorkspace')
  let workspace = state.workspace.getIn(['workspaces', currentWorkspace])
  let items
  let selectedDirectory
  let selectedTexture
  let profileId
  if (workspace) {
    profileId = workspace.get('profile')
    selectedDirectory = workspace.get('selectedDirectory')
    if (selectedDirectory) {
      items = state.profile.getIn(['profiles', workspace.get('profile'), 'items'])
    }
    selectedTexture = workspace.get('selectedTexture')
  }
  return {
    sizes: state.ui.get('treeSizes'),
    workspaces: state.workspace.get('workspaces'),
    currentWorkspace,
    selectedDirectory,
    selectedTexture,
    items,
    profileId,
    settings: state.ui.get('settings')
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    deleteWorkspace,
    setCurrentWorkspace,
    setCurrentDirectory,
    setCurrentTexture,
    moveItem,
    deleteItem,
    downloadItem,
    addItemObject,
    copyItemToClipboard,
    setTreeSize
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Workspace)
