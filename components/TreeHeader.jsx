const React = require('react');
const _ = require('lodash');
const interfaceActions = require('../actions/interface');

const TreeHandle = React.createClass({
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
        const diff = event.clientX - this.startPos;
        const newSize = this.startSize + diff;
        interfaceActions.setTreeSize(this.props.index, newSize);
    },

    handleMouseUp(event) {
        window.removeEventListener('mousemove', this.handleMouseMove, false);
    },

    handleMouseDown(event) {
        this.startPos = event.clientX;
        this.startSize = this.props.size;

        window.addEventListener('mousemove', this.handleMouseMove, false);
    },

    render() {
        return (
            <div ref="handle" className="tree-handle" onMouseDown={this.handleMouseDown}></div>
        );
    },
});

const TreeHeader = React.createClass({
    render() {
        return (
            <div className="tree-header">
                {this.props.columns.map((col, i) => {
                    const style = {width: this.props.sizes[i]+'px'};
                    return (
                        <div key={i} className="tree-header-col" style={style}>
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
