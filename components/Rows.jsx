import React from 'react'

class Rows extends React.Component {
  render () {
    return (
      <div className='rows'>{this.props.children}</div>
    )
  }
}
export default Rows
