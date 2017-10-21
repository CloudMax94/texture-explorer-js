export const itemAddressCompare = (a, b) => {
  let res = 0
  if (a.get('type') === 'directory') res -= 2
  if (b.get('type') === 'directory') res += 2
  return res + (a.get('address') > b.get('address') ? 1 : (b.get('address') > a.get('address') ? -1 : 0))
}

export function getSuccessors (items, item) {
  let successors = []
  function traverse (parentId) {
    items.forEach((i) => {
      if (i.get('parentId') === parentId) {
        let id = i.get('id')
        successors.push(id)
        traverse(id)
      }
    })
  }
  traverse(item)
  return successors
}

export function getItemPath (items, itemId, relativeId = null) {
  let path = ''
  while (itemId && itemId !== relativeId) {
    let parent = items.get(itemId)
    path = '/' + parent.get('name') + path
    itemId = parent.get('parentId')
  }
  return path.substring(1)
}
