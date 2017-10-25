import React from 'react'
import { Provider } from 'react-redux'
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import App from './App'

class Root extends React.Component {
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
