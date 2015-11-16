const React = require('react');
const _ = require('lodash');
const Immutable = require('immutable');
const workspaceActions = require('../actions/workspace');
const textureManipulator = require('../lib/textureManipulator');
const workspaceStore = require('../stores/workspace');

const TreeItem = React.createClass({
    propTypes: {
        item: React.PropTypes.object,
        sizes: React.PropTypes.arrayOf(React.PropTypes.number), // Column sizes
        className: React.PropTypes.string, // Classes to add to item
        handleFocus: React.PropTypes.func, // Function for handling item focus
    },

    shouldComponentUpdate(nextProps) {
        return this.props.sizes !== nextProps.sizes ||
                !Immutable.is(this.props.className, nextProps.className) ||
                !Immutable.is(this.props.item, nextProps.item);
    },

    handleDoubleClick() {
        event.preventDefault();
        const item = this.props.item;
        if (item.get('type') === 'directory') {
            workspaceActions.setCurrentDirectory(item);
        } else if (item.get('type') === 'texture') {
            workspaceActions.setCurrentTexture(item);
        }
    },

    handleClick(event) {
        event.preventDefault();
        this.props.handleFocus(this.props.item);
    },

    render() {
        const item = this.props.item;
        const columns = [
            item.get('name'),
        ];

        columns.push(...[
            '0x'+_.padLeft(workspaceStore.getItemOffset(item).toString(16), 8, 0).toUpperCase(), // should be relative!
            '0x'+_.padLeft(item.get('address').toString(16), 8, 0).toUpperCase(),
        ]);
        if (item.get('type') === 'texture') {
            const size = item.get('width')*item.get('height')*textureManipulator.getFormat(item.get('format')).sizeModifier();
            columns.push(...[
                '0x'+_.padLeft((item.get('address')+size).toString(16), 8, 0).toUpperCase(),
                '0x'+_.padLeft(size.toString(16), 8, 0).toUpperCase(),
                item.get('format'),
                item.get('width'),
                item.get('height'),
            ]);
            if (textureManipulator.getFormat(item.get('format')).hasPalette()) {
                columns.push('0x'+_.padLeft(item.get('palette').toString(16), 8, 0).toUpperCase());
            }
        } else if (item.get('type') === 'directory') {
            columns.push(...[
                '0x'+_.padLeft((item.get('address')+item.get('length')).toString(16), 8, 0).toUpperCase(),
                '0x'+_.padLeft(item.get('length').toString(16), 8, 0).toUpperCase(),
            ]);
        }
        const classes = 'tree-item ' + this.props.className;
        return (
            <div className={classes}>
                {columns.map((data, i) => {
                    let icon = null;
                    const style = {};
                    if (this.props.sizes) {
                        style.width = this.props.sizes[i]+'px';
                    }
                    if (i === 0) {
                        if (item.get('type') === 'directory') {
                            icon = <i className="tree-icon icon">file_directory</i>;
                        } else if (item.get('type') === 'texture') {
                            if (item.get('blob')) {
                                icon = <i className="tree-icon" style={{backgroundImage: 'url('+item.get('blob')+')'}}>&nbsp;</i>;
                            } else {
                                icon = <i className="tree-icon icon">file_media</i>;
                            }
                        }
                    }
                    return (
                        <div key={i} className="tree-col" style={style} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick}>{icon}{data}</div>
                    );
                })}
            </div>
        );
    },
});
module.exports = TreeItem;
