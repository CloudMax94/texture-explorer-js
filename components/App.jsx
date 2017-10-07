import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createWorkspace } from '../actions/workspace'
import { setApplicationMenu } from '../actions/interface'
import { each } from 'lodash'
import { exists } from 'fs'
import { remote } from 'electron'

import initializeMenu from '../lib/menu'
import { openFile } from '../lib/fileHandler'

import Columns from './Columns.jsx'
import Container from './Container.jsx'
import Handle from './Handle.jsx'
import Workspaces from './Workspaces.jsx'
import ApplicationMenu from './ApplicationMenu.jsx'
import StatusBar from './StatusBar.jsx'
// import Dialog from './Dialog.jsx'

const argv = remote.getGlobal('argv')

class App extends React.Component {
  componentDidMount () {
    let menu = initializeMenu(this.props.dispatch)
    if (process.browser || argv._.indexOf('browsermenu') > -1) {
      this.props.setApplicationMenu(menu)
    }
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
  render () {
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
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {}
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch,
    ...bindActionCreators({
      createWorkspace,
      setApplicationMenu
    }, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
