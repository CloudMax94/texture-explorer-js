import React from 'react'
import { Provider } from 'react-redux'
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { remote } from 'electron'
import App from './App'

import { prompt } from '../actions/interface'
import initializeMenu from '../utils/menu'

class Root extends React.Component {
  componentDidMount () {
    initializeMenu(this.props.store)
    if ('attachPromptAction' in remote.dialog) {
      remote.dialog.attachPromptAction((...args) => {
        this.props.store.dispatch(prompt(...args))
      })
    }
  }
  render () {
    return (
      <DragDropContextProvider backend={HTML5Backend}>
        <Provider store={this.props.store}>
          <App />
        </Provider>
      </DragDropContextProvider>
    )
  }
}
export default Root
