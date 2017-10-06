import React from 'react'
import { is } from 'immutable'

export class ImmutablePureComponent extends React.Component {
  shouldComponentUpdate (nextProps, nextState) {
    const state = this.state || {}
    return !Object.keys({...nextProps, ...this.props}).every((p) => is(nextProps[p], this.props[p])) ||
           !Object.keys({...nextState, ...state}).every((s) => is(nextState[s], state[s]))
  }
}

export default ImmutablePureComponent
