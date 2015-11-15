const React = require('react');

const TreeItem = require('./TreeItem.jsx');
const TreeHeader = require('./TreeHeader.jsx');

const TreeView = React.createClass({
    propTypes: {
        workspace: React.PropTypes.object, // Workspace the treeview belongs to
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
        if (!this.props.workspace || !this.props.workspace.get('selectedDirectory')) {
            return null;
        }

        let children = null;
        const childItems = this.props.workspace.get('items').sort((a, b) => {
            let res = 0;
            if (a.type === 'directory') res -= 2;
            if (b.type === 'directory') res += 2;
            return res + (a.address > b.address ? 1 : b.address > a.address ? -1 : 0);
        }).filter(x => x.parentId === this.props.workspace.get('selectedDirectory'));
        if (childItems) {
            children = childItems.map((item, i) => {
                return (
                    <TreeItem
                        key={item.get('name')}
                        item={item}
                        focusedItem={this.state.focusedItem}
                        handleFocus={this.focusItem}
                        sizes={this.props.sizes}
                    />
                );
            });
        }

        return (
            <div className="tree-view">
                <TreeHeader sizes={this.props.sizes} columns={['File', 'Offset', 'Start', 'End', 'Size', 'Format', 'Width', 'Height', 'Palette Address']}/>
                <div className="tree-content" tabIndex="0">
                    {children}
                </div>
            </div>
        );
    },
});
module.exports = TreeView;
