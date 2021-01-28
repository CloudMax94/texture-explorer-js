import React from 'react'
import { createPortal } from 'react-dom'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { DropTarget } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { toggleAboutDialog, closePrompt, closePopout } from '../actions/interface'
import { createWorkspace } from '../actions/workspace'

import { each } from 'lodash'
import { exists } from 'fs'
import { remote } from 'electron'

import { openFile } from '../utils/fileHandler'

import Dock from './Dock'
import Rows from '../components/Rows'
import Columns from '../components/Columns'
import Workspaces from '../components/Workspaces'
import ApplicationMenu from '../components/ApplicationMenu'
import Dialog from '../components/Dialog'
import PanelProvider from './PanelProvider'

const argv = remote.getGlobal('argv')

class App extends React.Component {
  constructor (props) {
    super(props)
    this.promptInput = React.createRef()

    this.popouts = {}

    // Close all popouts when closing the editor
    window.addEventListener('unload', () => {
      for (let popout of Object.values(this.popouts)) {
        popout.window.close()
      }
    })
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
  componentDidUpdate (prevProps) {
    // Close and remove all popouts that are not popped in the store
    for (let [id, popout] of Object.entries(this.popouts)) {
      if (!this.props.popout.contains(id)) {
        popout.window.close()
        delete this.popouts[id]
      }
    }
  }
  handleContextMenu = (event) => {
    event.preventDefault()
  }
  closeAboutDialog = () => {
    this.props.toggleAboutDialog(false)
  }
  getPopoutDOM = (id) => {
    if (!(id in this.popouts)) {
      let w = window.open('', id, 'height=235,width=320,directories=no,titlebar=no,menubar=no,toolbar=no,scrollbars=no,status=no')
      if (!w) {
        return
      }
      w.document.title = 'TE.js Panel'
      let ele = document.createElement('div')
      ele.classList.add('panel-item')
      w.document.documentElement.classList.add('panel-popout')
      w.document.body.appendChild(ele)

      let source = window.document
      let target = w.document
      for (let styleSheet of Array.from(window.document.styleSheets)) {
        // For <style> elements
        let rules
        try { rules = styleSheet.cssRules } catch (err) {}
        if (rules) {
          const newStyleEl = source.createElement('style')
          // Write the text of each rule into the body of the style element
          for (let cssRule of Array.from(styleSheet.cssRules)) {
            const { cssText, type } = cssRule
            let returnText = cssText
            // Check if the cssRule type is CSSImportRule (3) or CSSFontFaceRule (5) to handle local imports on a about:blank page
            // '/custom.css' turns to 'http://my-site.com/custom.css'
            if ([3, 5].includes(type)) {
              returnText = cssText.split('url(').map(line => {
                if (line[1] === '/') {
                  return `${line.slice(0, 1)}${
                    window.location.origin
                  }${line.slice(1)}`
                }
                return line
              }).join('url(')
            }
            newStyleEl.appendChild(source.createTextNode(returnText))
          }
          target.head.appendChild(newStyleEl)
        } else if (styleSheet.href) {
          // for <link> elements loading CSS from a URL
          const newLinkEl = source.createElement('link')
          newLinkEl.rel = 'stylesheet'
          newLinkEl.href = styleSheet.href
          target.head.appendChild(newLinkEl)
        }
      }

      w.onunload = () => {
        delete this.popouts[id]
        this.props.closePopout(id)
      }
      this.popouts[id] = {
        DOM: ele,
        window: w
      }
      // TODO - Listen to the window and unset popout state when it is closed!
    }
    return this.popouts[id].DOM
  }
  render () {
    const {
      menu,
      prompt,
      closePrompt,
      showAbout,
      popout,
      connectDropTarget
    } = this.props

    let dialog

    if (prompt) {
      let settings = prompt.get('settings')
      let onClose = () => {
        closePrompt()
        let callback = prompt.get('callback')
        if (callback) {
          callback()
        }
      }
      let buttons = settings.get('buttons')
      if (buttons) {
        buttons = buttons.map((button) => {
          let callback = button.get('callback')
          if (callback) {
            button = button.set('callback', () => {
              closePrompt()
              callback(this.promptInput.current.value)
            })
          } else {
            button = button.set('callback', onClose)
          }
          return button
        })
      }
      dialog = <Dialog title={settings.get('title')} buttons={buttons} onClose={onClose}>
        <div className='inputs'>
          <input ref={this.promptInput} type={settings.get('type')} defaultValue={settings.get('value')} />
        </div>
      </Dialog>
    } else if (showAbout) {
      dialog = (<Dialog title={`About ${remote.app.getName()}`} onClose={this.closeAboutDialog}>
        Version: {remote.app.getVersion()}<br />
        Website: <a href='https://cloudmodding.com' target='_blank'>cloudmodding.com</a><br />
        Created by CloudMax 2015-2021.
      </Dialog>)
    }

    let popouts = []
    for (let panel of popout.toArray()) {
      let winDOM = this.getPopoutDOM(panel)
      if (!winDOM) {
        continue
      }
      popouts.push(
        createPortal(<PanelProvider panel={panel} layoutDirection={'horizontal'} popout />, winDOM)
      )
    }
    return connectDropTarget(
      <div className='app' onContextMenu={this.handleContextMenu}>
        <ApplicationMenu menu={menu} />
        <Rows>
          <Dock index={0} />
          <Columns>
            <Dock index={1} />
            <Workspaces />
            <Dock index={2} />
          </Columns>
          <Dock index={3} />
        </Rows>
        {dialog}
        {popouts}
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    menu: state.ui.get('menu'),
    showAbout: state.ui.get('showAbout'),
    prompt: state.ui.get('prompt'),
    popout: state.ui.get('popout')
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    // Interface
    toggleAboutDialog,
    closePrompt,
    closePopout,
    // Workspace
    createWorkspace
  }, dispatch)
}

const fileTarget = {
  drop (props, monitor) {
    if (monitor.didDrop()) {
      return
    }
    const files = monitor.getItem().files
    if (files && files.length) {
      openFile(files[0], (data) => {
        props.createWorkspace(data)
      })
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(
  DropTarget(NativeTypes.FILE, fileTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget()
  }))(App)
)
