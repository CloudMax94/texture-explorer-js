import React from 'react'

class Columns extends React.Component {
  render () {
    return (
      <div className='columns'>{this.props.children}</div>
    )
  }
}
export default Columns
