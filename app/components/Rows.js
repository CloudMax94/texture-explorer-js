import React from 'react'

class Rows extends React.Component {
  renderChild = (child) => React.cloneElement(child, {
    layoutDirection: 'vertical'
  })
  render () {
    return (
      <div className='rows' style={this.props.style}>{React.Children.map(this.props.children, this.renderChild)}</div>
    )
  }
}
export default Rows
