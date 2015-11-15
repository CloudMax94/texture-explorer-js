const React   = require('react');
const Reflux  = require('reflux');

const interfaceStore  = require('../stores/interface');

const StatusBar = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            status: interfaceStore.getStatus(),
        };
    },
    componentDidMount() {
        this.listenTo(interfaceStore, this.oninterfaceStoreChange);
    },
    oninterfaceStoreChange() {
        this.setState({
            status: interfaceStore.getStatus(),
        });
    },
    render() {
        return (
            <div className="status-bar">{this.state.status}</div>
        );
    },
});
module.exports = StatusBar;
