const React = require('react');
const _ = require('lodash');
const workspaceActions = require('../actions/workspace');
const textureManipulator = require('../lib/textureManipulator');
const workspaceStore = require('../stores/workspace');

const TreeItem = React.createClass({
    propTypes: {
        item: React.PropTypes.object,
        sizes: React.PropTypes.arrayOf(React.PropTypes.number), // Column sizes
        focusedItem: React.PropTypes.string, // Focused item id
        selectedDirectory: React.PropTypes.string, // Selected directory id
        handleFocus: React.PropTypes.func, // Function for handling item focus
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
        const dataList = [
            item.get('name'),
        ];
        const start = workspaceStore.getItemAbsoluteAddress(item);
        dataList.push(...[
            '0x'+_.padLeft(item.get('address').toString(16), 8, 0).toUpperCase(),
            '0x'+_.padLeft(start.toString(16), 8, 0).toUpperCase(),
        ]);
        if (item.get('type') === 'texture') {
            const size = item.get('width')*item.get('height')*textureManipulator.getFormat(item.get('format')).sizeModifier();
            dataList.push(...[
                '0x'+_.padLeft((start+size).toString(16), 8, 0).toUpperCase(),
                '0x'+_.padLeft(size.toString(16), 8, 0).toUpperCase(),
                item.get('format'),
                item.get('width'),
                item.get('height'),
            ]);
            if (textureManipulator.getFormat(item.get('format')).hasPalette()) {
                dataList.push('0x'+_.padLeft(item.get('palette').toString(16), 8, 0).toUpperCase());
            }
        } else if (item.get('type') === 'directory') {
            dataList.push(...[
                '0x'+_.padLeft((start+item.get('length')).toString(16), 8, 0).toUpperCase(),
                '0x'+_.padLeft(item.get('length').toString(16), 8, 0).toUpperCase(),
            ]);
        }
        let classes = 'tree-item';
        if (item.get('id') === this.props.focusedItem) {
            classes += ' focused';
        }
        if (item.get('id') === this.props.selectedDirectory) {
            classes += ' selected';
        }
        return (
            <div key={item.get('name')} className={classes}>
                {dataList.map((data, i) => {
                    let icon = null;
                    const style = {};
                    if (this.props.sizes) {
                        style.width = this.props.sizes[i]+'px';
                    }
                    if (i === 0) {
                        if (item.get('type') === 'directory') {
                            icon = <i className="tree-icon icon">file_directory</i>;
                        } else if (item.get('type') === 'texture') {
                            const blob = workspaceStore.getItemBlob(item);
                            if (blob) {
                                icon = <i className="tree-icon" style={{backgroundImage: 'url('+blob+')'}}>&nbsp;</i>;
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
