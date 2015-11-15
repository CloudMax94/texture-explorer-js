const React = require('react');

const TreeItem = require('./TreeItem.jsx');

const TreeView = React.createClass({
    propTypes: {
        workspace: React.PropTypes.object, // Workspace the treeview belongs to
        root: React.PropTypes.object, // Root item of the treeview
        sizes: React.PropTypes.arrayOf(React.PropTypes.number), // Column sizes
    },
    getInitialState() {
        return {
            focusedItem: null,
        };
    },
    focusItem(item) {
        this.setState({focusedItem: item.get('id')});
    },
    render() {
        if (!this.props.workspace || !this.props.root) {
            return null;
        }

        const selectedDirectory = this.props.workspace.get('selectedDirectory');
        let items = this.props.workspace.get('items').sort((a, b) => {
            let res = 0;
            if (a.type === 'directory') res -= 2;
            if (b.type === 'directory') res += 2;
            return res + (a.address > b.address ? 1 : b.address > a.address ? -1 : 0);
        });
        const grouped = items.groupBy(x => x.parentId);

        let children = null;
        const rootItem = grouped.get(this.props.root);
        if (rootItem) {
            children = rootItem.map((item, i) => {
                return (
                    <TreeItem
                        key={item.get('name')}
                        item={item}
                        focusedItem={this.state.focusedItem}
                        handleFocus={this.focusItem}
                        sizes={this.props.sizes}
                        selectedDirectory={selectedDirectory}
                    />
                );
            });
        }

        return (
            <div className="tree-content" tabIndex="0">
                {children}
            </div>
        );
    },
});
module.exports = TreeView;
