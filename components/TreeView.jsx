const React = require('react');

const TreeItem = require('./TreeItem.jsx');
const TreeHeader = require('./TreeHeader.jsx');

const TreeView = React.createClass({
    propTypes: {
        items: React.PropTypes.object, // Items
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
        if (!this.props.items) {
            return null;
        }

        const children = this.props.items.map((item, i) => {
            let className = '';
            if (i === this.state.focusedItem) {
                className = 'focused';
            }
            return (
                <TreeItem
                    key={i}
                    item={item}
                    className={className}
                    handleFocus={this.focusItem}
                    sizes={this.props.sizes}
                />
            );
        }).toArray();

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
