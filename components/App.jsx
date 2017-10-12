import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { BLOB_UNSET } from '../constants/workspace'
import {
  toggleAboutDialog,
  setContainerSize,
  movePanelToContainer,
  movePanelGroupToContainer
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

import Rows from './Rows'
import Columns from './Columns'
import Container from './Container'
import Handle from './Handle'
import Workspaces from './Workspaces'
import ApplicationMenu from './ApplicationMenu'
import Dialog from './Dialog'

const argv = remote.getGlobal('argv')

class App extends React.Component {
  constructor (props) {
    super(props)
    this.handleResize = []
    for (let i = 0; i < 4; i++) {
      this.handleResize[i] = (size) => {
        this.props.setContainerSize(i, size)
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
  setupContainer = (index) => {
    const {
      containerLayouts,
      containerSizes
    } = this.props
    let direction = 'horizontal'
    if (index === 1 || index === 2) {
      direction = 'vertical'
    }

    return (<Container
      index={index}
      direction={direction}
      layout={containerLayouts.get(index)}
      size={containerSizes.get(index)}
      createWorkspace={this.props.createWorkspace}
      movePanelToContainer={this.props.movePanelToContainer}
      movePanelGroupToContainer={this.props.movePanelGroupToContainer}
      setCurrentDirectory={this.props.setCurrentDirectory}
      setCurrentTexture={this.props.setCurrentTexture}
      insertData={this.props.insertData}
      updateItemBlob={this.props.updateItemBlob}
      setProfile={this.props.setProfile}
      saveProfile={this.props.saveProfile}
      setItemData={this.props.setItemData}
      {...this.props.pass}
    />)
  }
  render () {
    const {
      menu,
      showAbout,
      containerSizes
    } = this.props
    let aboutDialog
    if (showAbout) {
      aboutDialog = (<Dialog title='About Texture Explorer.js' onClose={this.closeAboutDialog}>
        Website: cloudmodding.com<br />
        Created by CloudMax 2015-2017.
      </Dialog>)
    }
    return (
      <div className='app' onDragOver={this.handleDragOver} onDragEnd={this.handleDragEnd} onDrop={this.handleDrop} onContextMenu={this.handleContextMenu}>
        <ApplicationMenu menu={menu} />
        <Rows>
          {this.setupContainer(0)}
          <Handle size={containerSizes.get(0)} direction='vertical' onResize={this.handleResize[0]} />
          <Columns>
            {this.setupContainer(1)}
            <Handle size={containerSizes.get(1)} onResize={this.handleResize[1]} />
            <Workspaces />
            <Handle size={containerSizes.get(2)} reverse onResize={this.handleResize[2]} />
            {this.setupContainer(2)}
          </Columns>
          <Handle size={containerSizes.get(3)} reverse onResize={this.handleResize[3]} />
          {this.setupContainer(3)}
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
    containerSizes: state.ui.getIn(['settings', 'containerSizes']),
    containerLayouts: state.ui.getIn(['settings', 'layout']),
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
    setContainerSize,
    movePanelToContainer,
    movePanelGroupToContainer,
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
