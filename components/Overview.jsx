const React = require('react');
const Reflux  = require('reflux');

const TreeView = require('./TreeView.jsx');

const workspaceStore  = require('../stores/workspace');

const Overview = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            workspace: workspaceStore.getCurrentWorkspace(),
        };
    },
    componentDidMount() {
        this.listenTo(workspaceStore, this.onWorkspaceStoreChange);
    },
    onWorkspaceStoreChange() {
        this.setState({
            workspace: workspaceStore.getCurrentWorkspace(),
        });
    },
    render() {
        return (
            <TreeView
                workspace={this.state.workspace}
                root={this.state.workspace?this.state.workspace.get('root'):null}
                list={true}
            />
        );
    },
});
module.exports = Overview;
