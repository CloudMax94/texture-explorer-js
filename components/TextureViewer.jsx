const React = require('react');
const Reflux  = require('reflux');

const workspaceStore = require('../stores/workspace');
const workspaceActions = require('../actions/workspace');
const textureManipulator = require('../lib/textureManipulator');

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
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
    },
    handleDragEnd(event) {
        event.preventDefault();
        event.stopPropagation();
    },
    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files[0];
        const reader = new FileReader();

        reader.onloadend = (e) => {
            const pngBuffer = new Buffer(new Uint8Array(e.target.result));
            textureManipulator.pngToPixelData(pngBuffer, (pixelData, format) => {
                const texture = this.state.workspace.getIn(['items', this.state.workspace.get('selectedTexture')]);
                const buffer = textureManipulator.pixelDataToRaw(pixelData, texture.get('format'));
                workspaceActions.insertData(buffer, texture.get('address'));
            });
        };
        reader.readAsArrayBuffer(file);
    },
    render() {
        if (!this.state.workspace || !this.state.workspace.get('selectedTexture')) {
            return null;
        }

        const texture = this.state.workspace.getIn(['items', this.state.workspace.get('selectedTexture')]);
        const blob = texture.get('blob');

        return (
            <div className="texture-viewer">
                <div className="texture-viewer-inner">
                    <img src={blob} onDragOver={this.handleDragOver} onDragEnd={this.handleDragEnd} onDrop={this.handleDrop}/>
                </div>
            </div>
        );
    },
});
module.exports = TextureViewer;
