import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleAboutDialog } from '../actions/interface'
import { createWorkspace } from '../actions/workspace'

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
    let direction = 'horizontal'
    if (index === 1 || index === 2) {
      direction = 'vertical'
    }

    let out = <Dock
      index={index}
      direction={direction}
      handle={index === 0 || index === 1 ? 'after' : 'before'}
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
  return {
    menu: state.ui.get('menu'),
    showAbout: state.ui.get('showAbout')
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    // Interface
    toggleAboutDialog,
    // Workspace
    createWorkspace
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
