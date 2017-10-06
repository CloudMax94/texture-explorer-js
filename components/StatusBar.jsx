import React from 'react'
import { connect } from 'react-redux'

class StatusBar extends React.Component {
  render () {
    return (
      <div className='status-bar'>{this.props.status}</div>
    )
  }
}

function mapStateToProps (state) {
  return {
    status: state.ui.get('status')
  }
}

export default connect(mapStateToProps)(StatusBar)
