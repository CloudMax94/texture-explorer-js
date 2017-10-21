import { createSelector } from 'reselect'
import { getItemPath } from '../lib/helpers'

const getProfiles = (state) => {
  return state.profile.get('profiles')
}

const getWorkspaces = (state) => {
  return state.workspace.get('workspaces')
}

export const getCurrentWorkspaceId = (state) => {
  return state.workspace.get('currentWorkspace')
}

export const getCurrentWorkspace = createSelector(
  getWorkspaces,
  getCurrentWorkspaceId,
  (workspaces, currentWorkspaceId) => {
    if (currentWorkspaceId !== null) {
      return workspaces.get(currentWorkspaceId)
    }
    return null
  }
)

export const getCurrentWorkspaceKey = createSelector(
  getCurrentWorkspace,
  (currentWorkspace) => {
    if (currentWorkspace !== null) {
      return currentWorkspace.get('key')
    }
    return null
  }
)

export const getProfileList = createSelector(
  getCurrentWorkspace,
  getProfiles,
  (currentWorkspace, profiles) => {
    if (currentWorkspace !== null && profiles !== null) {
      return profiles.filter(
        (profile) => profile.get('key') === currentWorkspace.get('key')
      ).map((profile) => {
        return profile.get('name')
      })
    }
    return null
  }
)

export const getCurrentProfileId = createSelector(
  getCurrentWorkspace,
  (currentWorkspace) => {
    if (currentWorkspace !== null) {
      return currentWorkspace.get('profile')
    }
    return null
  }
)

export const getCurrentProfile = createSelector(
  getProfiles,
  getCurrentProfileId,
  (profiles, currentProfileId) => {
    if (currentProfileId !== null) {
      return profiles.get(currentProfileId)
    }
    return null
  }
)

export const getItems = createSelector(
  getCurrentProfile,
  (currentProfile) => {
    if (currentProfile !== null) {
      return currentProfile.get('items')
    }
    return null
  }
)

export const getBlobs = createSelector(
  getCurrentWorkspace,
  (currentWorkspace) => {
    if (currentWorkspace !== null) {
      return currentWorkspace.get('blobs')
    }
    return null
  }
)

export const getSelectedTextureId = createSelector(
  getCurrentWorkspace,
  (currentWorkspace) => {
    if (currentWorkspace !== null) {
      return currentWorkspace.get('selectedTexture')
    }
    return null
  }
)

export const getSelectedTexture = createSelector(
  getItems,
  getSelectedTextureId,
  (items, selectedTextureId) => {
    if (items !== null) {
      return items.get(selectedTextureId) || null
    }
    return null
  }
)

export const getSelectedTextureBlob = createSelector(
  getBlobs,
  getSelectedTextureId,
  (blobs, selectedTextureId) => {
    if (blobs !== null) {
      return blobs.get(selectedTextureId) || null
    }
    return null
  }
)

export const getSelectedTextureOffset = createSelector(
  getItems,
  getSelectedTexture,
  (items, selectedTexture) => {
    if (items !== null && selectedTexture !== null) {
      return items.getIn([selectedTexture.get('parentId'), 'address']) || 0
    }
    return 0
  }
)

export const getSelectedTexturePath = createSelector(
  getItems,
  getSelectedTexture,
  (items, selectedTexture) => {
    if (items !== null && selectedTexture !== null) {
      return getItemPath(items, selectedTexture.get('parentId'))
    }
    return ''
  }
)

export const getSelectedDirectoryId = createSelector(
  getCurrentWorkspace,
  (currentWorkspace) => {
    if (currentWorkspace !== null) {
      return currentWorkspace.get('selectedDirectory')
    }
    return null
  }
)

export const getSelectedDirectory = createSelector(
  getItems,
  getSelectedDirectoryId,
  (items, selectedDirectoryId) => {
    if (items !== null) {
      return items.get(selectedDirectoryId) || null
    }
    return null
  }
)

export const getSelectedDirectoryOffset = createSelector(
  getItems,
  getSelectedDirectory,
  (items, selectedDirectory) => {
    if (items !== null && selectedDirectory !== null) {
      return items.getIn([selectedDirectory.get('parentId'), 'address']) || 0
    }
    return 0
  }
)

export const getSelectedDirectoryPath = createSelector(
  getItems,
  getSelectedDirectory,
  (items, selectedDirectory) => {
    if (items !== null && selectedDirectory !== null) {
      return getItemPath(items, selectedDirectory.get('parentId'))
    }
    return ''
  }
)

export const getDirectories = createSelector(
  getItems,
  (items) => {
    if (items !== null) {
      return items.filter(x => x.get('type') === 'directory')
    }
    return null
  }
)

const directorySort = (a, b) => {
  return a.get('address') - b.get('address')
}

export const getSortedDirectories = createSelector(
  getDirectories,
  (directories) => {
    if (directories !== null) {
      return directories.sort(directorySort)
    }
    return null
  }
)
