'use strict';

var React = require('react');
var _ = require('lodash');
var interfaceActions = require('../actions/interface');
var interfaceStore  = require('../stores/interface');

var Handle = React.createClass({
    componentDidMount() {
        window.addEventListener('mouseup', this.handleMouseUp);
    },

    componentWillMount() {
        this.handleMouseMove = _.throttle(this.handleMouseMove, 30);
    },

    componentWillUnmount() {
        window.removeEventListener('mouseup', this.handleMouseMove);
        window.removeEventListener('mousemove', this.handleMouseMove);
    },

    handleMouseMove(event) {

        var ele = React.findDOMNode(this.refs.handle);
        var direction = window.getComputedStyle(ele.parentElement).getPropertyValue('flex-direction');

        var offset = 0;
        if (direction === 'column') {
            offset = event.clientY;
        } else {
            offset = event.clientX;
        }
        var diff = 0
        if (this.props.reverse !== true) {
            diff = offset - this.startPos;
        } else {
            diff = this.startPos - offset;
        }
        var newSize = this.startSize + diff;
        interfaceActions.setContainerSize(this.props.index, newSize);
    },

    handleMouseUp(event) {
        window.removeEventListener('mousemove', this.handleMouseMove, false);
    },

    handleMouseDown(event) {
        var ele = React.findDOMNode(this.refs.handle);
        var direction = window.getComputedStyle(ele.parentElement).getPropertyValue('flex-direction');
        if (direction === 'column') {
            this.startPos = event.clientY;
        } else {
            this.startPos = event.clientX;
        }
        this.startSize = interfaceStore.getContainerSize(this.props.index);

        window.addEventListener('mousemove', this.handleMouseMove, false);
    },

    render() {
        return (
            <div ref="handle" className='handle'>
                <div className='handle-inner' onMouseDown={this.handleMouseDown}></div>
            </div>
        );
    },
});
module.exports = Handle;
