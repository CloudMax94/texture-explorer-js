import { join, extname } from 'path'
import { readdirSync, readFile, writeFile } from 'fs'
import xml2js from 'xml2js'
import { padStart } from 'lodash'
import { Record, Map } from 'immutable'
import { getFormat } from '../lib/textureManipulator'
import { getSuccessors, itemAddressCompare } from '../lib/helpers'
import prettyJSON from '../lib/prettyJson'
import * as PROFILE from '../constants/profile'

let idCounter = 0

const ProfileRecord = Record({
  id: null,
  file: null,
  key: null,
  name: 'Default',
  loaded: false,
  items: Map()
})

const DirectoryRecord = Record({
  id: null,
  parentId: null,
  name: 'New Directory',
  address: 0,
  length: 0,
  type: 'directory'
})

const TextureRecord = Record({
  id: null,
  parentId: null,
  name: 'New Texture',
  address: 0,
  format: 'rgba32',
  width: 32,
  height: 32,
  palette: 0,
  type: 'texture'
})

function itemFormatPlural (format) {
  if (format.toLowerCase() === 'texture') {
    return 'textures'
  } else if (format.toLowerCase() === 'directory') {
    return 'directories'
  }
  return ''
}

function formatHex (int) {
  return '0x' + padStart(int.toString(16), 8, 0).toUpperCase()
}

function itemsToObject (items) {
  const groupedItems = items.sort(itemAddressCompare).groupBy(x => x.get('parentId'))
  const traverseItems = (id) => {
    let item = items.get(id)
    const obj = {
      name: item.get('name'),
      address: formatHex(item.get('address'))
    }
    if (item.get('type') === 'directory') {
      obj.size = formatHex(item.get('length'))
    } else if (item.get('type') === 'texture') {
      obj.format = item.get('format')
      obj.width = item.get('width')
      obj.height = item.get('height')
      let format = getFormat(item.get('format'))
      if (format.hasPalette()) {
        obj.palette = formatHex(item.get('palette'))
      }
    }
    let children = groupedItems.get(id)
    if (children) {
      const childrenByType = children.groupBy(x => x.get('type'))
      childrenByType.forEach((list, key) => {
        let type = itemFormatPlural(key)
        obj[type] = []
        list.forEach((item) => {
          obj[type].push(traverseItems(item.get('id')))
        })
      })
    }
    return obj
  }
  let root = traverseItems('root')
  root.version = '2'
  delete root.name
  delete root.address
  delete root.size
  return root
}

function writeProfile (profile, callback) {
  let data = prettyJSON(itemsToObject(profile.get('items')))
  let filePath = join(PROFILE.BASE_PATH, profile.get('key'), profile.get('file'))
  writeFile(filePath, data, (err) => {
    callback(err)
  })
}

function readProfile (profilePath, callback) {
  var profileExt = extname(profilePath)
  readFile(profilePath, function (err, data) {
    if (err) {
      console.error(err)
      callback(null)
    } else {
      if (profileExt === '.json') {
        try {
          var json = JSON.parse(data)
        } catch (e) {
          console.error('There was an error parsing ' + profilePath)
          console.error(e)
          return
        }
        callback(json)
      } else if (profileExt === '.xml') {
        var parser = new xml2js.Parser({
          tagNameProcessors: [function (name) {
            if (name === 'directory') return 'directories'
            else if (name === 'texture') return 'textures'
            return name
          }],
          attrNameProcessors: [],
          mergeAttrs: true,
          explicitArray: false
        })
        parser.parseString(data, function (err, result) {
          if (err) {
            console.error(err)
            return
          }

          const relativeToAbsolute = function (item, parentAddress = '0x0') {
            let address = '0x00000000'
            if ('address' in item) { // Root does not have an address
              item.address = '0x' + padStart((parseInt(item.address, 16) + parseInt(parentAddress, 16)).toString(16), 8, 0).toUpperCase()
              address = item.address
            }
            if ('palette' in item) {
              item.palette = '0x' + padStart((parseInt(item.palette, 16) + parseInt(parentAddress, 16)).toString(16), 8, 0).toUpperCase()
            }
            if (item.textures) {
              if (!Array.isArray(item.textures)) {
                item.textures = [item.textures]
              }
              item.textures.forEach((texture) => {
                relativeToAbsolute(texture, address)
              })
            }
            if (item.directories) {
              if (!Array.isArray(item.directories)) {
                item.directories = [item.directories]
              }
              item.directories.forEach((directory) => {
                relativeToAbsolute(directory, address)
              })
            }
          }
          relativeToAbsolute(result.root)
          callback(result.root)
        })
      }
    }
  })
}

function itemsFromObject (profile, length) {
  const types = ['directory', 'texture']
  const _innerLoop = (input, items, parent) => {
    for (let type of types) {
      if (input[itemFormatPlural(type)]) {
        input[itemFormatPlural(type)].forEach((i, index) => {
          let item
          const id = (idCounter++).toString(36)
          if (type === 'directory') {
            item = new DirectoryRecord({
              id,
              parentId: parent,
              name: i.name,
              address: parseInt(i.address, 16),
              length: parseInt(i.size, 16)
            })
            items = _innerLoop(i, items, id)
          } else {
            item = new TextureRecord({
              id,
              parentId: parent,
              name: i.name,
              address: parseInt(i.address, 16),
              format: i.format,
              width: parseInt(i.width),
              height: parseInt(i.height),
              palette: parseInt(i.palette, 16) || 0
            })
          }

          items = items.set(id, item)
        })
      }
    }
    return items
  }
  const id = 'root'
  const rootItem = new DirectoryRecord({
    id,
    name: 'Root',
    address: 0,
    absolute: 0,
    length: length
  })
  let items = Map()
  items = items.set(id, rootItem)
  if (profile) {
    items = _innerLoop(profile, items, id)
  }
  return items
}

export function loadProfile (profileId) {
  return async (dispatch, getState) => {
    let profile = getState().profile.getIn(['profiles', profileId])
    readProfile(join(PROFILE.BASE_PATH, profile.get('key'), profile.get('file')), (profileObject) => {
      let items = itemsFromObject(profileObject)
      dispatch({
        type: PROFILE.LOAD_PROFILE,
        profileId,
        items
      })
    })
  }
}

export function saveProfile (profileId) {
  return async (dispatch, getState) => {
    let profile = getState().profile.getIn(['profiles', profileId])
    writeProfile(profile, (err) => {
      if (err) {
        console.error(err)
      } else {
        dispatch({
          type: PROFILE.SAVE_PROFILE,
          profileId
        })
      }
    })
  }
}

export function prepareProfiles (key) {
  return async (dispatch, getState) => {
    const existingProfiles = getState().profile.get('profiles')
    const profileDir = join(PROFILE.BASE_PATH, key)
    let files = readdirSync(profileDir)
    let profiles = Map()
    for (let file of files.sort()) {
      const id = (idCounter++).toString(36)
      let [name, ext] = file.split('.')
      if (ext !== 'json') {
        if (ext !== 'xml') {
          continue
        }
        name += ` (${ext})`
      }

      if (existingProfiles.find((profile) => profile.get('key') === key && profile.get('file') === file)) {
        continue
      }

      let profile = new ProfileRecord({
        id,
        file,
        key,
        name
      })
      profiles = profiles.set(id, profile)
    }

    let defaultProfile = profiles.merge(existingProfiles).find((profile) => profile.get('key') === key && profile.get('name') === 'Default')
    if (!defaultProfile) { // If there is no default profile, create one
      const rootItem = new DirectoryRecord({
        id: 'root',
        name: 'Root',
        address: 0,
        absolute: 0,
        length: 0
      })

      let items = Map()
      items = items.set('root', rootItem)
      let id = (idCounter++).toString(36)
      defaultProfile = new ProfileRecord({
        id: id,
        items,
        key,
        file: 'Default.json',
        loaded: true
      })
      profiles = profiles.set(id, defaultProfile)
    }
    dispatch({
      type: PROFILE.ADD_PROFILES,
      profiles
    })
  }
}

// TODO: Remove all workspace logic. Have a profileId argument instead?
export function createDirectory () {
  return async (dispatch, getState) => {
    let state = getState()
    let workspace = state.workspace.getIn(['workspaces', state.workspace.get('currentWorkspace')])
    if (!workspace) {
      return
    }
    let profileId = workspace.get('profile')
    let selectedDirectory = state.profile.getIn(['profiles', profileId, 'items', workspace.get('selectedDirectory')])
    if (!selectedDirectory) {
      return
    }

    let id = (idCounter++).toString(36)
    let item = new DirectoryRecord({
      id,
      parentId: selectedDirectory.get('id'),
      address: selectedDirectory.get('address')
    })
    dispatch({
      type: PROFILE.ADD_ITEM,
      profileId,
      item
    })
  }
}

// TODO: Remove all workspace logic. Have a profileId argument instead?
export function createTexture () {
  return async (dispatch, getState) => {
    let state = getState()
    let workspace = state.workspace.getIn(['workspaces', state.workspace.get('currentWorkspace')])
    if (!workspace) {
      return
    }

    let profileId = workspace.get('profile')
    let selectedDirectory = state.profile.getIn(['profiles', profileId, 'items', workspace.get('selectedDirectory')])
    if (!selectedDirectory) {
      return
    }

    let id = (idCounter++).toString(36)
    let item = new TextureRecord({
      id,
      parentId: selectedDirectory.get('id'),
      address: selectedDirectory.get('address'),
      width: 32,
      height: 32,
      palette: 0
    })

    dispatch({
      type: PROFILE.ADD_ITEM,
      profileId,
      item
    })
  }
}

// TODO: Remove all workspace logic. We can iterate over profiles to find the one with the item?
export function deleteItem (itemId) {
  return async (dispatch, getState) => {
    let state = getState()
    let workspace = state.workspace.getIn(['workspaces', state.workspace.get('currentWorkspace')])
    if (!workspace) {
      return
    }
    let profileId = workspace.get('profile')
    let items = state.profile.getIn(['profiles', profileId, 'items'])
    let itemIds = [itemId, ...getSuccessors(items, itemId)]
    dispatch({
      type: PROFILE.DELETE_ITEMS,
      profileId,
      itemIds
    })
  }
}

export function setItemData (profileId, itemId, key, value) {
  return async (dispatch, getState) => {
    if (key === 'offset') {
      key = 'address'
      let items = getState().profile.getIn(['profiles', profileId, 'items'])
      let parentId = items.getIn([itemId, 'parentId'])
      value += items.getIn([parentId, 'address'])
    }

    dispatch({
      type: PROFILE.SET_ITEM_DATA,
      profileId,
      itemId,
      key,
      value
    })
  }
}
