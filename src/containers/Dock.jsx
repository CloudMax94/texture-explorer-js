import React from 'react'

import { is } from 'immutable'
import { itemAddressCompare } from '../lib/helpers'

import Rows from '../components/Rows'
import Columns from '../components/Columns'
import Handle from '../components/Handle'
import PanelGroup from '../components/PanelGroup'
import TextureViewer from '../components/TextureViewer'
import Overview from '../components/Overview'
import ItemSettings from '../components/ItemSettings'
import ProfileManager from '../components/ProfileManager'

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
    return !necessaryProps.every((p) => is(nextProps[p], this.props[p]))
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
        onResize={this.props.handleResize}
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

export default Dock
