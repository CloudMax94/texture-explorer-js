import React from 'react'
import { render } from 'react-dom'
import { createTransform, persistStore } from 'redux-persist'
import { fromJS } from 'immutable'
import { remote } from 'electron'
import { configureStore } from './store/configureStore'
import { AppContainer } from 'react-hot-loader'
import { prompt } from './actions/interface'
import initializeMenu from './menu'

import Root from './containers/Root'
import './sass/style.global.scss'

const argv = remote.getGlobal('argv')

const store = configureStore()
const interfaceTransform = createTransform(
  (inboundState, key) => {
    return inboundState.delete('menu')
                       .delete('prompt')
                       .delete('popout').toJS()
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
  // Initialize the application menu
  initializeMenu(store)
  // Hook up dialog shim to the store
  if ('attachPromptAction' in remote.dialog) {
    remote.dialog.attachPromptAction((...args) => {
      store.dispatch(prompt(...args))
    })
  }
  // Render application
  if (module.hot) {
    const hotRender = (Container) => {
      render(
        <AppContainer>
          <Container store={store} />
        </AppContainer>,
        document.getElementById('container')
      )
    }
    hotRender(Root)
    module.hot.accept('./containers/Root', () => {
      hotRender(require('./containers/Root').default)
    })
  } else {
    render(
      <Root store={store} />,
      document.getElementById('container')
    )
  }
})

if (argv._.indexOf('reset') > -1) {
  persistedStore.purge()
}
