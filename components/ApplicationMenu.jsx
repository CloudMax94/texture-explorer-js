import React from 'react'
import { connect } from 'react-redux'
import Menu from './Menu.jsx'

class ApplicationMenu extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }
  render () {
    if (!this.props.menu) {
      return null
    }
    return (
      <div className='application-menu'>
        <Menu data={this.props.menu} />
      </div>
    )
  }
}

function mapStateToProps (state) {
  let menu = state.ui.get('menu')
  return {
    menu: menu
  }
}

export default connect(mapStateToProps)(ApplicationMenu)
