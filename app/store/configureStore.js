import { createStore, applyMiddleware, compose } from 'redux'
import { autoRehydrate } from 'redux-persist'
import thunk from 'redux-thunk'
import rootReducer from '../reducers'

export function configureStore (initialState) {
  const middleware = []
  const enhancers = []

  // Thunk Middleware
  middleware.push(thunk)

  // Apply Middleware & Compose Enhancers
  enhancers.push(
    applyMiddleware(...middleware),
    autoRehydrate()
  )
  const enhancer = compose(...enhancers)

  // Create Store
  return createStore(rootReducer, initialState, enhancer)
}

export default {
  configureStore
}
