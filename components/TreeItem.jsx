'use strict';

var React = require('react');
var _ = require('lodash');
var workspaceActions = require('../actions/workspace');
var textureManipulator = require('../lib/textureManipulator');
var workspaceStore = require('../stores/workspace');

var TreeItem = React.createClass({
    getInitialState() {
        return {
        };
    },

    handleDoubleClick(event) {
        event.preventDefault();
        var item = this.props.item;
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
        var depth = this.props.depth?this.props.depth:0;
        var item = this.props.item;
        var dataList = [
            item.get('name'),
        ];
        if (this.props.nameOnly !== true) {
            var start = workspaceStore.getItemAbsoluteAddress(item);
            dataList.push(...[
                '0x'+_.padLeft(item.get('address').toString(16), 8, 0).toUpperCase(),
                '0x'+_.padLeft(start.toString(16), 8, 0).toUpperCase(),
            ]);
            if (item.get('type') === 'texture') {
                var size = item.get('width')*item.get('height')*textureManipulator.getFormat(item.get('format')).sizeModifier();
                dataList.push(...[
                    '0x'+_.padLeft((start+size).toString(16), 8, 0).toUpperCase(),
                    '0x'+_.padLeft(size.toString(16), 8, 0).toUpperCase(),
                    item.get('format'),
                    item.get('width'),
                    item.get('height')
                ]);
                if (textureManipulator.getFormat(item.get('format')).hasPalette()) {
                    dataList.push('0x'+_.padLeft(item.get('palette').toString(16), 8, 0).toUpperCase());
                };
            } else if (item.get('type') === 'directory') {
                dataList.push(...[
                    '0x'+_.padLeft((start+item.get('length')).toString(16), 8, 0).toUpperCase(),
                    '0x'+_.padLeft(item.get('length').toString(16), 8, 0).toUpperCase()
                ]);
            }
        }
        var children = [];
        if (this.props.traverse !== 0) {
            var mapItem = (item, i) => {
                return <TreeItem
                            key={item.get('name')}
                            nameOnly={this.props.nameOnly}
                            depth={depth+1}
                            traverse={this.props.traverse-1}
                            handleFocus={this.props.handleFocus}
                            focusedItem={this.props.focusedItem}
                            selectedDirectory={this.props.selectedDirectory}
                            item={item}
                            items={this.props.items}
                            sizes={this.props.sizes}
                        />;
            };
            var group = this.props.items.get(item.get('id'));

            if (group) {
                children.push(...group.map(mapItem));
            }
        }
        var classes = 'tree-item';
        if (item.equals(this.props.focusedItem)) {
            classes += ' focused';
        }
        if (item.equals(this.props.selectedDirectory)) {
            classes += ' selected';
        }
        return (
            <div key={item.get('name')} className={classes}>
                {dataList.map((data, i) => {
                    var icon = null;
                    var style = {
                    };
                    if (this.props.sizes) {
                        style.width = this.props.sizes[i]+'px';
                    }
                    if (i === 0) {
                        style.paddingLeft = (24*depth)+8+'px';
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
                        <div key={i} className='tree-col' style={style} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick}>{icon}{data}</div>
                    );
                })}
                <div className="tree-items">
                    {children}
                </div>
            </div>
        );
    }
});
module.exports = TreeItem;
