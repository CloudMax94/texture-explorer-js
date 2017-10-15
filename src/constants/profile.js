import { join } from 'path'
import { remote } from 'electron'

export const BASE_PATH = join(remote.app.getPath('userData'), '/Profiles')

export const ADD_PROFILE = 'ADD_PROFILE'
export const ADD_PROFILES = 'ADD_PROFILES'
export const LOAD_PROFILE = 'LOAD_PROFILE'
export const SAVE_PROFILE = 'SAVE_PROFILE'
export const DELETE_PROFILE = 'DELETE_PROFILE'
export const ADD_ITEM = 'ADD_ITEM'
export const ADD_ITEMS = 'ADD_ITEMS'
export const DELETE_ITEMS = 'DELETE_ITEMS'
export const SET_ITEM_DATA = 'SET_ITEM_DATA'
