const React = require('react');
const _ = require('lodash');

const interfaceActions = require('../actions/interface');
const interfaceStore  = require('../stores/interface');

const Handle = React.createClass({
    propTypes: {
        index: React.PropTypes.number, // index of the container to resize
        reverse: React.PropTypes.bool, // false = right/down, true = left/up
    },

    componentWillMount() {
        this.handleMouseMove = _.throttle(this.handleMouseMove, 30);
    },

    componentDidMount() {
        window.addEventListener('mouseup', this.handleMouseUp);
    },

    componentWillUnmount() {
        window.removeEventListener('mouseup', this.handleMouseMove);
        window.removeEventListener('mousemove', this.handleMouseMove);
    },

    handleMouseMove(event) {
        const ele = React.findDOMNode(this.refs.handle);
        const direction = window.getComputedStyle(ele.parentElement).getPropertyValue('flex-direction');

        let offset = 0;
        if (direction === 'column') {
            offset = event.clientY;
        } else {
            offset = event.clientX;
        }
        let diff = 0;
        if (this.props.reverse !== true) {
            diff = offset - this.startPos;
        } else {
            diff = this.startPos - offset;
        }
        const newSize = this.startSize + diff;
        interfaceActions.setContainerSize(this.props.index, newSize);
    },

    handleMouseUp(event) {
        window.removeEventListener('mousemove', this.handleMouseMove, false);
    },

    handleMouseDown(event) {
        const ele = React.findDOMNode(this.refs.handle);
        const direction = window.getComputedStyle(ele.parentElement).getPropertyValue('flex-direction');
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
            <div ref="handle" className="handle">
                <div className="handle-inner" onMouseDown={this.handleMouseDown}></div>
            </div>
        );
    },
});
module.exports = Handle;
