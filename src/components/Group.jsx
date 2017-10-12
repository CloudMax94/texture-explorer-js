import React from 'react'

class Group extends React.Component {
  render () {
    return (
      <div className='group'>
        <fieldset>
          <legend>{this.props.title}</legend>
          {this.props.children}
        </fieldset>
      </div>
    )
  }
}
export default Group
