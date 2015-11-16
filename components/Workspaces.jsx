const React = require('react');
const Reflux  = require('reflux');

const TreeView = require('./TreeView.jsx');

const workspaceStore = require('../stores/workspace');
const interfaceStore = require('../stores/interface');
const workspaceActions = require('../actions/workspace');

const Workspace = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            sizes: interfaceStore.getTreeSizes(),
            workspaces: workspaceStore.getWorkspaces(),
            current: workspaceStore.getCurrentWorkspace(),
        };
    },
    componentDidMount() {
        this.listenTo(workspaceStore, this.onWorkspaceStoreChange);
        this.listenTo(interfaceStore, this.onInterfaceStoreChange);
    },
    onWorkspaceStoreChange() {
        this.setState({
            workspaces: workspaceStore.getWorkspaces(),
            current: workspaceStore.getCurrentWorkspace(),
        });
    },
    onInterfaceStoreChange(data) {
        if (data !== 'tree') return;
        this.setState({
            sizes: interfaceStore.getTreeSizes(),
        });
    },
    handleTabClick(workspace) {
        workspaceActions.setCurrentWorkspace(workspace);
    },
    render() {
        const tabs = this.state.workspaces.map((workspace, i) => {
            const classes = [
                'workspace-tab',
            ];
            if (workspace === this.state.current) {
                classes.push('selected');
            }
            return (
                <div key={i} className={classes.join(' ')} onClick={this.handleTabClick.bind(this, workspace)}>
                    <span className="btnText">{workspace.get('name')}</span>
                    <span className="closeBtn">x</span>
                </div>
            );
        }).toArray();
        let items = null;
        if (this.state.current && this.state.current.get('selectedDirectory')) {
            items = this.state.current.get('items').filter(x => x.parentId === this.state.current.get('selectedDirectory'));
        }
        return (
            <div className="workspace">
                <div className="workspace-tabs">
                    {tabs}
                </div>
                <div className="workspace-content">
                    <TreeView sizes={this.state.sizes} items={items}/>
                </div>
            </div>
        );
    },
});
module.exports = Workspace;
