import { combineReducers } from 'redux'
import ui from './interface'
import profile from './profile'
import workspace from './workspace'

const rootReducer = combineReducers({
  ui,
  profile,
  workspace
})

export default rootReducer
