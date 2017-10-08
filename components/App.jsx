import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleAboutDialog } from '../actions/interface'
import { createWorkspace } from '../actions/workspace'
import { each } from 'lodash'
import { exists } from 'fs'
import { remote } from 'electron'

import { openFile } from '../lib/fileHandler'

import Columns from './Columns.jsx'
import Container from './Container.jsx'
import Handle from './Handle.jsx'
import Workspaces from './Workspaces.jsx'
import ApplicationMenu from './ApplicationMenu.jsx'
import StatusBar from './StatusBar.jsx'
import Dialog from './Dialog.jsx'

const argv = remote.getGlobal('argv')

class App extends React.Component {
  componentDidMount () {
    each(argv._, (filePath) => {
      if (filePath !== 'main.js') {
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
  closeAboutDialog = () => {
    this.props.toggleAboutDialog(false)
  }
  render () {
    let aboutDialog
    if (this.props.showAbout) {
      aboutDialog = (<Dialog title='About Texture Explorer.js' onClose={this.closeAboutDialog}>
        Website: cloudmodding.com<br />
        Created by CloudMax 2015-2017.
      </Dialog>)
    }
    return (
      <div className='app' onDragOver={this.handleDragOver} onDragEnd={this.handleDragEnd} onDrop={this.handleDrop}>
        <ApplicationMenu />
        <Container index={0} direction='horizontal' />
        <Handle index={0} />
        <Columns>
          <Container index={1} direction='vertical' />
          <Handle index={1} />
          <Workspaces />
          <Handle index={2} reverse />
          <Container index={2} direction='vertical' />
        </Columns>
        <Handle index={3} reverse />
        <Container index={3} direction='horizontal' />
        <StatusBar />
        {aboutDialog}
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    showAbout: state.ui.get('showAbout')
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    createWorkspace,
    toggleAboutDialog
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
