'use strict';

var React = require('react');
var Reflux = require('reflux');
var _ = require('lodash');
var TreeItem = require('./TreeItem.jsx');
var interfaceActions = require('../actions/interface');
var interfaceStore = require('../stores/interface');

var TreeHandle = React.createClass({
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
        var diff = event.clientX - this.startPos;
        var newSize = this.startSize + diff;
        interfaceActions.setTreeSize(this.props.index, newSize);
    },

    handleMouseUp(event) {
        window.removeEventListener('mousemove', this.handleMouseMove, false);
    },

    handleMouseDown(event) {
        var ele = React.findDOMNode(this.refs.handle);
        this.startPos = event.clientX;
        this.startSize = this.props.size;

        window.addEventListener('mousemove', this.handleMouseMove, false);
    },

    render() {
        return (
            <div ref="handle" className='tree-handle' onMouseDown={this.handleMouseDown}></div>
        );
    },
});

var TreeHeader = React.createClass({
    render() {
        return (
            <div className='tree-header'>
                {this.props.columns.map((col, i) => {
                    var style = {width: this.props.sizes[i]+'px'};
                    return (
                        <div key={i} className='tree-header-col' style={style}>
                            {col}
                            <TreeHandle index={i} size={this.props.sizes[i]} />
                        </div>
                    );
                })}
            </div>
        );
    },
});
module.exports = TreeHeader;
