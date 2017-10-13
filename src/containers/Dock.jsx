import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { is } from 'immutable'
import { itemAddressCompare } from '../lib/helpers'

import { BLOB_UNSET } from '../constants/workspace'

import {
  setDockSize,
  movePanelToDock,
  movePanelGroupToDock
} from '../actions/interface'
import {
  createWorkspace,
  setCurrentDirectory,
  setCurrentTexture,
  insertData,
  updateItemBlob,
  setProfile
} from '../actions/workspace'
import { saveProfile, setItemData } from '../actions/profile'

import Rows from '../components/Rows'
import Columns from '../components/Columns'
import Handle from '../components/Handle'
import PanelGroup from '../components/PanelGroup'

import TextureViewer from '../components/panels/TextureViewer'
import Overview from '../components/panels/Overview'
import ItemSettings from '../components/panels/ItemSettings'
import ProfileManager from '../components/panels/ProfileManager'

const NecessaryDockProps = [
  'layout', 'size', 'index', 'direction'
]

const NecessaryPanelProps = {
  textureSettings: ['profile', 'selectedTexture'],
  directorySettings: ['profile', 'selectedDirectory'],
  itemPreview: ['workspace', 'selectedTexture', 'blob', 'blobState'],
  settings: [],
  overview: ['profile', 'selectedDirectory'],
  profileManager: ['workspace', 'profile', 'profileList'],
  finder: []
}

function getNecessaryPanelProps (props) {
  let layout = props.layout
  if (!layout) {
    return []
  }
  let necessaryProps = []
  for (let panel of props.layout.flatten().toArray()) {
    if (panel in NecessaryPanelProps) {
      for (let prop of NecessaryPanelProps[panel]) {
        if (necessaryProps.indexOf(prop) === -1) {
          necessaryProps.push(prop)
        }
      }
    }
  }
  return necessaryProps
}

class Dock extends React.Component {
  shouldComponentUpdate (nextProps, nextState) {
    let necessaryProps = [...NecessaryDockProps, ...getNecessaryPanelProps(nextProps)]
    let shouldUpdate = !necessaryProps.every((p) => is(nextProps[p], this.props[p]))
    return shouldUpdate
  }
  getPanel (name) {
    switch (name) {
      case 'textureSettings': {
        const { profile, selectedTexture } = this.props
        let offset = 0
        if (selectedTexture && profile) {
          let parentItem = profile.getIn(['items', selectedTexture.get('parentId')])
          if (parentItem) {
            offset = selectedTexture.get('address') - parentItem.get('address')
          }
        }
        return <ItemSettings
          key='Texture Settings'
          type={'texture'}
          item={selectedTexture}
          offset={offset}
          profileId={profile ? profile.get('id') : null}
          setItemData={this.props.setItemData}
        />
      }
      case 'directorySettings': {
        const { profile, selectedDirectory } = this.props
        let offset = 0
        if (selectedDirectory && profile) {
          let parentItem = profile.getIn(['items', selectedDirectory.get('parentId')])
          if (parentItem) {
            offset = selectedDirectory.get('address') - parentItem.get('address')
          }
        }
        return <ItemSettings
          key='Directory Settings'
          type={'directory'}
          item={selectedDirectory}
          offset={offset}
          profileId={profile ? profile.get('id') : null}
          setItemData={this.props.setItemData}
        />
      }
      case 'itemPreview': {
        const { workspace, selectedTexture, blob, blobState } = this.props
        return <TextureViewer
          key='Image Preview'
          itemId={selectedTexture ? selectedTexture.get('id') : null}
          workspaceId={workspace ? workspace.get('id') : null}
          blob={blob}
          blobState={blobState}
          insertData={this.props.insertData}
          updateItemBlob={this.props.updateItemBlob}
        />
      }
      case 'settings': {
        return <span
          key='Settings'
        />
      }
      case 'overview': {
        const { profile, selectedDirectory } = this.props
        let items
        if (profile) {
          items = profile.get('items')
          if (items) {
            items = items.filter(x => x.type === 'directory').sort(itemAddressCompare)
          }
        }
        return <Overview
          key='Directory Tree'
          items={items}
          selectedDirectoryId={selectedDirectory ? selectedDirectory.get('id') : null}
          setCurrentTexture={this.props.setCurrentTexture}
          setCurrentDirectory={this.props.setCurrentDirectory}
        />
      }
      case 'profileManager': {
        const { profile, workspace, profileList } = this.props
        return <ProfileManager
          key='Profile Manager'
          profileId={profile ? profile.get('id') : ''}
          workspaceId={workspace ? workspace.get('id') : ''}
          profileList={profileList}
          saveProfile={this.props.saveProfile}
          setProfile={this.props.setProfile}
        />
      }
      case 'finder': {
        return <span
          key='Texture Finder'
        />
      }
    }
  }
  handleResize = (size) => {
    this.props.setDockSize(this.props.index, size)
  }
  render () {
    const { layout, size } = this.props
    const content = layout.map((panelNames, i) =>
      <PanelGroup
        key={i}
        index={i}
        dockId={this.props.index}
        movePanelToDock={this.props.movePanelToDock}
        movePanelGroupToDock={this.props.movePanelGroupToDock}
      >
        {panelNames.map((panelName) => this.getPanel(panelName)).toList()}
      </PanelGroup>
    )
    if (!content.size) {
      return null
    }
    let Wrap
    if (this.props.direction === 'horizontal') {
      Wrap = Columns
    } else {
      Wrap = Rows
    }
    let output = [
      <Wrap key='dock' style={{flex: '0 0 ' + size + 'px'}} layoutDirection={this.props.layoutDirection}>{content}</Wrap>
    ]
    if (this.props.handle) {
      let handle = <Handle
        key='handle'
        size={size}
        layoutDirection={this.props.layoutDirection}
        onResize={this.handleResize}
        reverse={this.props.handle === 'before'}
      />
      if (this.props.handle === 'before') {
        output.unshift(handle)
      } else if (this.props.handle === 'after') {
        output.push(handle)
      }
    }
    return output
  }
}

function mapStateToProps (state, ownProps) {
  let workspaceId = state.workspace.get('currentWorkspace')
  let workspace = state.workspace.getIn(['workspaces', workspaceId])
  let profile
  let selectedDirectory
  let selectedTexture
  let blobState
  let blob
  let profileList

  if (workspace) {
    profile = state.profile.getIn(['profiles', workspace.get('profile')])
    if (profile) {
      selectedDirectory = profile.getIn(['items', workspace.get('selectedDirectory')])
      selectedTexture = profile.getIn(['items', workspace.get('selectedTexture')])
    }
    if (selectedTexture) {
      blobState = workspace.getIn(['blobs', selectedTexture.get('id'), 'blobState']) || BLOB_UNSET
      blob = workspace.getIn(['blobs', selectedTexture.get('id'), 'blob'])
    }
    profileList = state.profile.get('profiles')
      .filter((profile) => profile.get('key') === workspace.get('key'))
      .map((profile) => {
        return profile.get('name')
      }).toList()
  }

  return {
    size: state.ui.getIn(['settings', 'dockSizes', ownProps.index]),
    layout: state.ui.getIn(['settings', 'layout', ownProps.index]),
    workspace,
    profile,
    selectedDirectory,
    selectedTexture,
    blobState,
    blob,
    profileList
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    // Interface
    setDockSize,
    movePanelToDock,
    movePanelGroupToDock,
    // Workspace
    createWorkspace,
    setCurrentDirectory,
    setCurrentTexture,
    insertData,
    updateItemBlob,
    setProfile,
    // Profile
    saveProfile,
    setItemData
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Dock)
