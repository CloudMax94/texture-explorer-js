import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  deleteWorkspace,
  setCurrentWorkspace,
  setCurrentDirectory,
  setCurrentTexture
} from '../actions/workspace'
import {
  deleteItem,
  copyItemToClipboard,
  addItemObject
} from '../actions/profile'
import { setTreeSize } from '../actions/interface'
import { getItemPath } from '../utils/helpers'
import { remote } from 'electron'

import ImmutablePureComponent from './ImmutablePureComponent'
import TreeView from './TreeView'

class Workspace extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {
      'search': ''
    }
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
      this.searchbar.focus()
    }
  }

  handleTabClick (workspace) {
    this.props.setCurrentWorkspace(workspace)
  }

  handleCloseClick (workspaceId, event) {
    event.stopPropagation()
    this.props.deleteWorkspace(workspaceId)
  }

  handleSearch = (event) => {
    this.setState({search: event.target.value})
  }

  render () {
    const {
      workspaces,
      sizes,
      profileId,
      items,
      currentWorkspace,
      selectedDirectory,
      selectedTexture,
      setCurrentDirectory,
      setCurrentTexture,
      deleteItem,
      addItemObject,
      copyItemToClipboard,
      setTreeSize,
      settings
    } = this.props

    const tabs = workspaces.toList().map((workspace, i) => {
      const classes = [
        'workspace-tab'
      ]
      if (workspace.get('id') === currentWorkspace) {
        classes.push('selected')
      }
      return (
        <div key={i} className={classes.join(' ')} onClick={this.handleTabClick.bind(this, workspace)}>
          <span className='btnText'>{workspace.get('name')}</span>
          <span className='closeBtn' onClick={this.handleCloseClick.bind(this, workspace.get('id'))}>x</span>
        </div>
      )
    })
    let filteredItems = null
    if (items && selectedDirectory) {
      let search = this.state.search.toLowerCase()
      if (search.length) {
        filteredItems = items.toList().filter(item => {
          let path = getItemPath(items, item.get('id'), 0)
          if (path.toLowerCase().indexOf(search) > -1) {
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
        filteredItems = items.toList().filter(item => item.get('parentId') === selectedDirectory)
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
            deleteItem={deleteItem}
            addItemObject={addItemObject}
            copyItemToClipboard={copyItemToClipboard}
            doubleClickSelect={settings.get('doubleClickSelect') === true}
          />
        </div>,
        <div key='search' className='search-bar'>
          <input ref={(searchbar) => { this.searchbar = searchbar }} type='text' disabled={!selectedDirectory} placeholder='Search...' onChange={this.handleSearch} />
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
    deleteItem,
    addItemObject,
    copyItemToClipboard,
    setTreeSize
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Workspace)
