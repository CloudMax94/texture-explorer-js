const React = require('react');
const Reflux  = require('reflux');

const workspaceStore = require('../stores/workspace');
// const workspaceActions = require('../actions/workspace');

const TextureViewer = React.createClass({
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
        if (!this.state.workspace || !this.state.workspace.get('selectedTexture')) {
            return null;
        }
        const texture = this.state.workspace.getIn(['items', this.state.workspace.get('selectedTexture')]);
        const blob = workspaceStore.getBlobUrl(texture.get('blobHash'));
        return (
            <div className="texture-viewer">
                <div className="texture-viewer-inner">
                    <img src={blob}/>
                </div>
            </div>
        );
    },
});
module.exports = TextureViewer;
