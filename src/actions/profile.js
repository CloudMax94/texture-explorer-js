import { join } from 'path'
import { readdirSync, readFile, writeFile, unlink } from 'fs'
import { Parser } from 'xml2js'
import { padStart } from 'lodash'
import { Record, Map } from 'immutable'
import { getFormat } from '../lib/textureManipulator'
import { getSuccessors, itemAddressCompare } from '../lib/helpers'
import { saveFileAs } from '../lib/fileHandler'
import prettyJSON from '../lib/prettyJson'
import { clipboard } from 'electron'
import * as PROFILE from '../constants/profile'

let idCounter = 0
function getUniqueId () {
  return (idCounter++).toString(36)
}

const ProfileRecord = Record({
  id: null,
  file: null,
  key: null,
  name: 'New Profile',
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

function itemsToObject (items, originId) {
  const groupedItems = items.sort(itemAddressCompare).groupBy(x => x.get('parentId'))
  const traverseItems = (id) => {
    let item = items.get(id)
    const obj = {}
    if (id === 'root') {
      obj.version = '2'
    } else {
      obj.name = item.get('name')
      obj.address = formatHex(item.get('address'))
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
  return traverseItems(originId)
}

function writeProfile (profile, callback) {
  let data = prettyJSON(itemsToObject(profile.get('items'), 'root'))
  let filePath = join(PROFILE.BASE_PATH, profile.get('key'), profile.get('file'))
  writeFile(filePath, data, (err) => {
    callback(err)
  })
}

function prepareRoot (itemObject) {
  itemObject.address = '0x0'
  itemObject.size = '0x0'
  itemObject.name = 'Root'
  return itemObject
}

function parseProfile (data, ext, callback) {
  if (ext === 'json') {
    try {
      var json = JSON.parse(data)
    } catch (e) {
      callback(e)
      return
    }
    callback(null, prepareRoot(json))
  } else if (ext === 'xml') {
    var parser = new Parser({
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
      callback(null, prepareRoot(result.root))
    })
  } else {
    callback(new Error(`Could not parse profile, unknown format "${ext}"`))
  }
}

function itemsFromObject (itemObject, type = 'directory', parentId = null) {
  const types = ['directory', 'texture']
  let items = Map()
  const _innerLoop = (input, type, parentId) => {
    const id = parentId ? getUniqueId() : 'root' // If item doesn't have a parent, it's the root!
    if (type === 'directory') {
      let item = new DirectoryRecord({
        id,
        parentId,
        name: input.name,
        address: parseInt(input.address, 16),
        length: parseInt(input.size, 16) || 0
      })
      items = items.set(id, item)
    } else if (type === 'texture') {
      let item = new TextureRecord({
        id,
        parentId,
        name: input.name,
        address: parseInt(input.address, 16),
        format: input.format,
        width: parseInt(input.width),
        height: parseInt(input.height),
        palette: parseInt(input.palette, 16) || 0
      })
      items = items.set(id, item)
    } else {
      return
    }
    for (let type of types) {
      if (input[itemFormatPlural(type)]) {
        input[itemFormatPlural(type)].forEach((i, index) => {
          _innerLoop(i, type, id)
        })
      }
    }
  }
  _innerLoop(itemObject, type, parentId)
  return items
}

export function importProfile (file, key) {
  return async (dispatch, getState) => {
    let [name, ext] = file.name.split('.')

    parseProfile(file.data, ext, (err, profileObject) => {
      if (err) {
        console.error('There was an error parsing ' + file.path)
        console.error(err)
        return
      }
      let origName = name
      let i = 1
      while (i++) {
        let profileExists = getState().profile.get('profiles').find(profile => profile.get('name') === name)
        if (!profileExists) {
          break
        }
        name = `${origName} (${i})`
      }

      console.log(profileObject)
      let items = itemsFromObject(profileObject)
      let profileId = getUniqueId()
      let profile = new ProfileRecord({
        id: profileId,
        items,
        key,
        file: name + '.json',
        name,
        loaded: true
      })
      dispatch({
        type: PROFILE.ADD_PROFILE,
        profile
      })
      writeProfile(profile, (err) => {
        if (err) {
          console.error(err)
        } else {
        }
      })
    })
  }
}

export function loadProfile (profileId) {
  return async (dispatch, getState) => {
    let profile = getState().profile.getIn(['profiles', profileId])
    let profilePath = join(PROFILE.BASE_PATH, profile.get('key'), profile.get('file'))
    readFile(profilePath, function (err, data) {
      if (err) {
        console.error(err)
        return
      }
      let [, ext] = profile.get('file').split('.')
      parseProfile(data, ext, (err, profileObject) => {
        if (err) {
          console.error('There was an error parsing ' + profilePath)
          console.error(err)
          return
        }
        let items = itemsFromObject(profileObject)
        dispatch({
          type: PROFILE.LOAD_PROFILE,
          profileId,
          items
        })
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

export function exportProfile (profileId) {
  return async (dispatch, getState) => {
    let state = getState().profile
    let profile = state.getIn(['profiles', profileId])
    if (!profile) {
      return
    }
    const data = prettyJSON(itemsToObject(profile.get('items'), 'root'))
    saveFileAs(profile.get('name') + '.json', data, (err) => {
      if (err) {
        console.error(err)
      }
      dispatch({
        type: PROFILE.PROFILE_EXPORTED,
        success: !err
      })
    })
  }
}

export function renameProfile (profileId, name) {
  return async (dispatch, getState) => {
    // TODO: Check if another profile already exists with the same name

    let profile = getState().profile.getIn(['profiles', profileId])
    let oldPath = join(PROFILE.BASE_PATH, profile.get('key'), profile.get('file'))

    profile = profile.set('name', name).set('file', name + '.json')
    writeProfile(profile, (err) => {
      if (err) {
        console.error(err)
      } else {
        dispatch({
          type: PROFILE.SAVE_PROFILE,
          profileId
        })
        dispatch({
          type: PROFILE.RENAME_PROFILE,
          profileId,
          name
        })
        unlink(oldPath, (err) => {
          if (err) {
            console.error(err)
          } else {
          }
        })
      }
    })
  }
}

export function deleteProfile (profileId) {
  return async (dispatch, getState) => {
    let profile = getState().profile.getIn(['profiles', profileId])
    let filePath = join(PROFILE.BASE_PATH, profile.get('key'), profile.get('file'))
    unlink(filePath, (err) => {
      if (err) {
        console.error(err)
      } else {
        dispatch({
          type: PROFILE.DELETE_PROFILE,
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
      let [name, ext] = file.split('.')
      if (ext !== 'json') {
        continue
      }

      if (existingProfiles.find((profile) => profile.get('key') === key && profile.get('file') === file)) {
        continue
      }
      const id = getUniqueId()
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
        absolute: 0
      })

      let items = Map()
      items = items.set('root', rootItem)
      let id = getUniqueId()
      defaultProfile = new ProfileRecord({
        id,
        items,
        key,
        file: 'Default.json',
        name: 'Default',
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

export function createProfile (key, name = 'New Profile') {
  return async (dispatch, getState) => {
    let origName = name
    let i = 1
    while (i++) {
      let profileExists = getState().profile.get('profiles').find(profile => profile.get('name') === name)
      if (!profileExists) {
        break
      }
      name = `${origName} (${i})`
    }

    let items = Map()
    items = items.set('root', new DirectoryRecord({
      id: 'root',
      name: 'Root',
      address: 0,
      absolute: 0
    }))
    let id = getUniqueId()
    let profile = new ProfileRecord({
      id,
      items,
      key,
      name,
      file: name + '.json',
      loaded: true
    })

    dispatch({
      type: PROFILE.ADD_PROFILE,
      profile
    })

    writeProfile(profile, (err) => {
      if (err) {
        console.error(err)
      } else {
      }
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

    let id = getUniqueId()
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

    let id = getUniqueId()
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

export function addItemObject (profileId, itemObject, parentId) {
  return async (dispatch, getState) => {
    let items = itemsFromObject(itemObject, itemObject.type, parentId)
    dispatch({
      type: PROFILE.ADD_ITEMS,
      profileId,
      items
    })
  }
}

export function copyItemToClipboard (profileId, itemId) {
  return async (dispatch, getState) => {
    let state = getState()
    let items = state.profile.getIn(['profiles', profileId, 'items'])
    let item = items.get(itemId)
    if (item) {
      let object = itemsToObject(items, itemId)
      object.type = item.get('type')
      clipboard.writeText(JSON.stringify(object))
    }
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
