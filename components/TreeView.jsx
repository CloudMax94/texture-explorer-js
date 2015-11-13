'use strict';

var React = require('react');
var Reflux = require('reflux');
var _ = require('lodash');

var TreeItem = require('./TreeItem.jsx');

var TreeView = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            focusedItem: null
        };
    },
    focusItem(item) {
        this.setState({focusedItem: item});
    },
    render() {
        if (!this.props.workspace || !this.props.root)
            return null;

        var selectedDirectory = this.props.workspace.get('selectedDirectory');
        //var items = this.props.workspace.get('items').toIndexedSeq().sortBy((x) => x.address);
        var items = this.props.workspace.get('items').toIndexedSeq().sort((a,b) => {
            var res = 0;
            if (a.type === 'directory') res -= 2;
            if (b.type === 'directory') res += 2;
            return res + (a.address > b.address ? 1 : b.address > a.address ? -1 : 0);
        });
        if (this.props.list) {
            items = items.filter(x => x.type === 'directory');
        }
        var grouped = items.groupBy(x => x.parentId);

        var mapItem = (item, i) => {
            return <TreeItem
                        key={item.get('name')}
                        items={grouped}
                        item={item}
                        focusedItem={this.state.focusedItem}
                        handleFocus={this.focusItem}
                        sizes={this.props.sizes}
                        selectedDirectory={selectedDirectory}
                        traverse={this.props.list?-1:0}
                        hideTextures={this.props.list}
                        nameOnly={this.props.list}
                    />;
        };

        var items = this.props.workspace.get('items');

        var children;
        if (this.props.list) {
            children = [mapItem(this.props.root, 0)];
        } else {
            var rootItem = grouped.get(this.props.root.id);
            if (rootItem) {
                children = rootItem.map(mapItem);
            }
        }

        return (
            <div className='tree-content' tabIndex="0">
                {children}
            </div>
        );
    },
});
module.exports = TreeView;
