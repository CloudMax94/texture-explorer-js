import { fromJS } from 'immutable'
import * as PROFILE from '../constants/profile'
import { itemAddressCompare } from '../utils/helpers'

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
    case PROFILE.RENAME_PROFILE: {
      const { profileId, name } = action
      return state.updateIn(['profiles', profileId], (profile) => {
        return profile.set('name', name).set('file', name + '.json')
      })
    }
    case PROFILE.DELETE_PROFILE: {
      return state.deleteIn(['profiles', action.profileId])
    }
    case PROFILE.ADD_ITEM: {
      const { profileId, item } = action
      return state.setIn(
        ['profiles', profileId, 'items'],
        state.getIn(['profiles', action.profileId, 'items']).set(item.get('id'), item).sort(itemAddressCompare)
      )
    }
    case PROFILE.ADD_ITEMS: {
      const { profileId, items } = action
      return state.setIn(
        ['profiles', profileId, 'items'],
        state.getIn(['profiles', action.profileId, 'items']).merge(items).sort(itemAddressCompare)
      )
    }
    case PROFILE.DELETE_ITEMS: {
      const { profileId, itemIds } = action
      return state.updateIn(['profiles', profileId, 'items'], (items) => {
        return items.deleteAll(itemIds)
      })
    }
    case PROFILE.SET_ITEM_DATA:
      let items = state.getIn(['profiles', action.profileId, 'items'])
      items = items.setIn([action.itemId, action.key], action.value)
      if (action.key === 'address') {
        items = items.sort(itemAddressCompare)
      }
      return state.setIn(['profiles', action.profileId, 'items'], items)
    default:
      return state
  }
}
