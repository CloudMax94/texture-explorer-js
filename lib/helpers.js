export const itemAddressCompare = (a, b) => {
  let res = 0
  if (a.get('type') === 'directory') res -= 2
  if (b.get('type') === 'directory') res += 2
  return res + (a.get('address') > b.get('address') ? 1 : (b.get('address') > a.get('address') ? -1 : 0))
}
