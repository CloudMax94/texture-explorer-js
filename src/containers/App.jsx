import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { BLOB_UNSET } from '../constants/workspace'
import {
  toggleAboutDialog,
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

import { each } from 'lodash'
import { exists } from 'fs'
import { remote } from 'electron'

import { openFile } from '../lib/fileHandler'

import Dock from './Dock'
import Rows from '../components/Rows'
import Columns from '../components/Columns'
import Workspaces from '../components/Workspaces'
import ApplicationMenu from '../components/ApplicationMenu'
import Dialog from '../components/Dialog'

const argv = remote.getGlobal('argv')

class App extends React.Component {
  constructor (props) {
    super(props)
    this.handleResize = []
    for (let i = 0; i < 4; i++) {
      this.handleResize[i] = (size) => {
        this.props.setDockSize(i, size)
      }
    }
  }
  componentDidMount () {
    each(argv._, (filePath) => {
      if (filePath !== '.') {
        exists(filePath, (exists) => {
          if (exists) {
            openFile(filePath, (data) => {
              this.props.createWorkspace(data)
            })
          }
        })
      }
    })
  }
  handleDragOver = (event) => {
    event.preventDefault()
  }
  handleDragEnd = (event) => {
    event.preventDefault()
  }
  handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    openFile(event.dataTransfer.files[0], (data) => {
      this.props.createWorkspace(data)
    })
  }
  handleContextMenu = (event) => {
    event.preventDefault()
  }
  closeAboutDialog = () => {
    this.props.toggleAboutDialog(false)
  }
  setupDock = (index) => {
    const {
      dockLayouts,
      dockSizes
    } = this.props
    let direction = 'horizontal'
    if (index === 1 || index === 2) {
      direction = 'vertical'
    }

    let out = <Dock
      index={index}
      direction={direction}
      handle={index === 0 || index === 1 ? 'after' : 'before'}
      handleResize={this.handleResize[index]}
      layout={dockLayouts.get(index)}
      size={dockSizes.get(index)}
      createWorkspace={this.props.createWorkspace}
      movePanelToDock={this.props.movePanelToDock}
      movePanelGroupToDock={this.props.movePanelGroupToDock}
      setCurrentDirectory={this.props.setCurrentDirectory}
      setCurrentTexture={this.props.setCurrentTexture}
      insertData={this.props.insertData}
      updateItemBlob={this.props.updateItemBlob}
      setProfile={this.props.setProfile}
      saveProfile={this.props.saveProfile}
      setItemData={this.props.setItemData}
      {...this.props.pass}
    />
    return out
  }
  render () {
    const {
      menu,
      showAbout
    } = this.props
    let aboutDialog
    if (showAbout) {
      aboutDialog = (<Dialog title={`About ${remote.app.getName()}`} onClose={this.closeAboutDialog}>
        Version: {remote.app.getVersion()}<br />
        Website: cloudmodding.com<br />
        Created by CloudMax 2015-2017.
      </Dialog>)
    }
    return (
      <div className='app' onDragOver={this.handleDragOver} onDragEnd={this.handleDragEnd} onDrop={this.handleDrop} onContextMenu={this.handleContextMenu}>
        <ApplicationMenu menu={menu} />
        <Rows>
          {this.setupDock(0)}
          <Columns>
            {this.setupDock(1)}
            <Workspaces />
            {this.setupDock(2)}
          </Columns>
          {this.setupDock(3)}
        </Rows>
        {aboutDialog}
      </div>
    )
  }
}

function mapStateToProps (state) {
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
    menu: state.ui.get('menu'),
    showAbout: state.ui.get('showAbout'),
    dockSizes: state.ui.getIn(['settings', 'dockSizes']),
    dockLayouts: state.ui.getIn(['settings', 'layout']),
    pass: {
      workspace,
      profile,
      selectedDirectory,
      selectedTexture,
      blobState,
      blob,
      profileList
    }
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    // Interface
    toggleAboutDialog,
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

export default connect(mapStateToProps, mapDispatchToProps)(App)
