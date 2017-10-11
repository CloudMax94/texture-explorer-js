import React from 'react'

class Columns extends React.Component {
  render () {
    return (
      <div className='columns'>{React.Children.map(this.props.children, child => React.cloneElement(child, {
        layoutDirection: 'horizontal'
      }))}</div>
    )
  }
}
export default Columns
