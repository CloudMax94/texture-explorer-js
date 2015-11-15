const React           = require('react');
const Reflux          = require('reflux');
const Menu            = require('./Menu.jsx');
const interfaceStore  = require('../stores/interface');

const ApplicationMenu = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            menu: interfaceStore.getApplicationMenu(),
        };
    },
    componentDidMount() {
        this.listenTo(interfaceStore, this.oninterfaceStoreChange);
    },
    oninterfaceStoreChange() {
        this.setState({
            menu: interfaceStore.getApplicationMenu(),
        });
    },
    render() {
        if (!this.state.menu) {
            return null;
        }
        return (
            <div className="application-menu">
                <Menu data={this.state.menu}/>
            </div>
        );
    },
});
module.exports = ApplicationMenu;
