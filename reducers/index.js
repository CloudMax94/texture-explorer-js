import { combineReducers } from 'redux'
import ui from './interface'
import workspace from './workspace'

const rootReducer = combineReducers({
  ui,
  workspace
})

export default rootReducer
