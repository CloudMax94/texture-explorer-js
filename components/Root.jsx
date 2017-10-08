import React from 'react'
import { Provider } from 'react-redux'
import App from './App.jsx'

import initializeMenu from '../lib/menu'

class Root extends React.Component {
  componentDidMount () {
    initializeMenu(this.props.store)
  }
  render () {
    return (
      <Provider store={this.props.store}>
        <App />
      </Provider>
    )
  }
}
export default Root
