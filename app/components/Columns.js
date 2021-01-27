import React from 'react'

class Columns extends React.Component {
  renderChild = (child) => React.cloneElement(child, {
    layoutDirection: 'horizontal'
  })
  render () {
    return (
      <div className='columns' style={this.props.style}>{React.Children.map(this.props.children, this.renderChild)}</div>
    )
  }
}
export default Columns
