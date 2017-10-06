import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import rootReducer from '../reducers'

function configureStore (initialState) {
  const middleware = []
  const enhancers = []

  // Thunk Middleware
  middleware.push(thunk)

  // Apply Middleware & Compose Enhancers
  enhancers.push(
    applyMiddleware(...middleware)
  )
  const enhancer = compose(...enhancers)

  // Create Store
  return createStore(rootReducer, initialState, enhancer)
}

export default { configureStore }
