const React = require('react');

const Menu = React.createClass({
    propTypes: {
        data: React.PropTypes.object, // Menu Data
    },
    renderItem(item, key) {
        if (item.type === 'separator') {
            return (
                <div key={key} className="menu-separator"></div>
            );
        }

        const classes = [
            'menu-item',
        ];

        let subMenu = null;
        if (item.submenu) {
            classes.push('parent');
            subMenu = (
                <Menu data={item.submenu}/>
            );
        }
        let accelerator = null;
        if (item.globalKeyObject) {
            accelerator = item.globalKeyObject.text;
        }
        return (
            <div key={key} className={classes.join(' ')} data-accelerator={accelerator} onClick={item.click}>
                {item.label}
                {subMenu}
            </div>
        );
    },

    render() {
        if (!this.props.data) {
            return null;
        }
        const menuItems = this.props.data.items.map((item, i) => {
            return this.renderItem(item, i);
        });
        return (
            <div className="menu">
                {menuItems}
            </div>
        );
    },
});

module.exports = Menu;
