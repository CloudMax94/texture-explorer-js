import { fromJS } from 'immutable'
import * as PROFILE from '../constants/profile'

export default function profile (state = fromJS({
  profiles: {}
}), action) {
  switch (action.type) {
    case PROFILE.ADD_PROFILE:
      const { profile } = action
      return state.setIn(['profiles', profile.get('id')], profile)
    case PROFILE.ADD_PROFILES:
      const { profiles } = action
      return state.mergeIn(['profiles'], profiles)
    case PROFILE.LOAD_PROFILE: {
      const { profileId, items } = action
      return state.updateIn(['profiles', profileId], (profile) => {
        return profile.set('items', items).set('loaded', true)
      })
    }
    case PROFILE.SAVE_PROFILE: {
      return state
    }
    case PROFILE.DELETE_PROFILE: {
      return state.deleteIn(['profiles', action.profileId])
    }
    case PROFILE.ADD_ITEM: {
      const { profileId, item } = action
      return state.setIn(['profiles', profileId, 'items', item.get('id')], item)
    }
    case PROFILE.ADD_ITEMS: {
      const { profileId, items } = action
      return state.mergeIn(['profiles', profileId, 'items'], items)
    }
    case PROFILE.DELETE_ITEMS: {
      const { profileId, itemIds } = action
      return state.updateIn(['profiles', profileId, 'items'], (items) => {
        return items.deleteAll(itemIds)
      })
    }
    case PROFILE.SET_ITEM_DATA:
      return state.setIn(['profiles', action.profileId, 'items', action.itemId, action.key], action.value)
    default:
      return state
  }
}
