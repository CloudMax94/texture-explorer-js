import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { is } from 'immutable'
import { itemAddressCompare } from '../lib/helpers'

import { BLOB_UNSET } from '../constants/workspace'

import {
  setDockSize,
  setCurrentPanel,
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
import {
  importProfile,
  saveProfile,
  deleteProfile,
  setItemData
} from '../actions/profile'

import Rows from '../components/Rows'
import Columns from '../components/Columns'
import Handle from '../components/Handle'
import PanelGroup from '../components/PanelGroup'

import TextureViewer from '../components/panels/TextureViewer'
import Overview from '../components/panels/Overview'
import ItemSettings from '../components/panels/ItemSettings'
import ProfileManager from '../components/panels/ProfileManager'

const panelNames = {
  'textureSettings': 'Texture Settings',
  'directorySettings': 'Directory Settings',
  'itemPreview': 'Image Preview',
  'settings': 'Settings',
  'overview': 'Directory Tree',
  'profileManager': 'Profile Manager',
  'finder': 'Texture Finder'
}

const NecessaryDockProps = [
  'panelGroups', 'size', 'index', 'layoutDirection'
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
  let panelGroups = props.panelGroups
  if (!panelGroups) {
    return []
  }
  let necessaryProps = []
  for (let [, panelGroup] of props.panelGroups) {
    let currentPanel = panelGroup.get('currentPanel')
    if (currentPanel in NecessaryPanelProps) {
      for (let prop of NecessaryPanelProps[currentPanel]) {
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
  getPanel (panelId) {
    switch (panelId) {
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
          itemId={selectedTexture ? selectedTexture.get('id') : null}
          workspaceId={workspace ? workspace.get('id') : null}
          blob={blob}
          blobState={blobState}
          insertData={this.props.insertData}
          updateItemBlob={this.props.updateItemBlob}
        />
      }
      case 'settings': {
        return <span />
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
          items={items}
          selectedDirectoryId={selectedDirectory ? selectedDirectory.get('id') : null}
          setCurrentTexture={this.props.setCurrentTexture}
          setCurrentDirectory={this.props.setCurrentDirectory}
        />
      }
      case 'profileManager': {
        const { profile, workspace, profileList } = this.props
        return <ProfileManager
          profileId={profile ? profile.get('id') : null}
          workspaceId={workspace ? workspace.get('id') : null}
          workspaceKey={workspace ? workspace.get('key') : null}
          profileList={profileList}
          importProfile={this.props.importProfile}
          saveProfile={this.props.saveProfile}
          deleteProfile={this.props.deleteProfile}
          setProfile={this.props.setProfile}
        />
      }
      case 'finder': {
        return <span />
      }
    }
  }
  handleResize = (size) => {
    this.props.setDockSize(this.props.index, size)
  }
  render () {
    const { panelGroups, size, index } = this.props
    const content = panelGroups.map((panelGroup, panelGroupId) => {
      let panelId = panelGroup.get('currentPanel')
      return <PanelGroup
        key={panelGroupId}
        panelGroupId={panelGroupId}
        dockId={index}
        panels={panelGroup.get('panels').map((panel, panelId) => panelNames[panelId])}
        currentPanel={panelId}
        setCurrentPanel={this.props.setCurrentPanel}
        movePanelToDock={this.props.movePanelToDock}
        movePanelGroupToDock={this.props.movePanelGroupToDock}
      >
        {this.getPanel(panelId)}
      </PanelGroup>
    }).toList()
    if (!content.size) {
      return null
    }
    let Wrap
    if (this.props.layoutDirection === 'vertical') {
      Wrap = Columns
    } else {
      Wrap = Rows
    }
    let output = [
      <Wrap key='dock' style={{flex: '0 0 ' + size + 'px'}}>{content}</Wrap>
    ]
    let after = index === 0 || index === 1
    let handle = <Handle
      key='handle'
      size={size}
      layoutDirection={this.props.layoutDirection}
      onResize={this.handleResize}
      reverse={!after}
    />
    if (after) {
      output.push(handle)
    } else {
      output.unshift(handle)
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
      })
  }

  let panelGroups = state.ui.get('panelGroups').filter((panelGroup) =>
    panelGroup.get('dock') === ownProps.index
  ).map((panelGroup, panelGroupId) =>
    panelGroup.set('panels', state.ui.get('panels').filter((panel) =>
      panel.get('panelGroup') === panelGroupId
    ))
  )

  return {
    size: state.ui.getIn(['docks', ownProps.index, 'size']),
    panelGroups,
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
    setCurrentPanel,
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
    importProfile,
    saveProfile,
    deleteProfile,
    setItemData
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Dock)
