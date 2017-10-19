import React from 'react'
import { render } from 'react-dom'
import { createTransform, persistStore } from 'redux-persist'
import { fromJS } from 'immutable'
import { remote } from 'electron'
import { configureStore } from './stores/configureStore'
import Root from './containers/Root'

const argv = remote.getGlobal('argv')

const store = configureStore()
const interfaceTransform = createTransform(
  (inboundState, key) => {
    return inboundState.delete('menu').delete('showAbout').toJS()
  },
  (outboundState, key) => {
    return fromJS(outboundState)
  },
  {whitelist: ['ui']}
)
const storeConfig = {
  keyPrefix: '/' + remote.app.getName() + '/reducer/',
  whitelist: ['ui'],
  transforms: [interfaceTransform]
}

const persistedStore = persistStore(store, storeConfig, () => {
  render(React.createElement(Root, {
    store: store
  }), document.getElementById('container'))
})

if (argv._.indexOf('reset') > -1) {
  persistedStore.purge()
}
