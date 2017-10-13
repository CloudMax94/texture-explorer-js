import React from 'react'

class Rows extends React.Component {
  render () {
    return (
      <div className='rows' style={this.props.style}>{React.Children.map(this.props.children, child => React.cloneElement(child, {
        layoutDirection: 'vertical'
      }))}</div>
    )
  }
}
export default Rows
