const React = require('react');
const Reflux  = require('reflux');

const workspaceStore  = require('../stores/workspace');
const workspaceActions = require('../actions/workspace');

const Overview = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            items: null,
            selectedDirectory: null,
            focusedItem: null,
        };
    },
    componentDidMount() {
        this.listenTo(workspaceStore, this.onWorkspaceStoreChange);
    },
    onWorkspaceStoreChange(data) {
        if (data !== 'workspace' && data !== 'directory') {
            return;
        }
        this.setState({
            selectedDirectory: workspaceStore.getCurrentWorkspace().get('selectedDirectory'),
            items: workspaceStore.getDirectories(),
        });
    },
    handleDoubleClick(item) {
        if (item.get('type') === 'directory') {
            workspaceActions.setCurrentDirectory(item);
        } else if (item.get('type') === 'texture') {
            workspaceActions.setCurrentTexture(item);
        }
    },
    handleClick(item) {
        this.setState({focusedItem: item.get('id')});
    },
    render() {
        if (!this.state.items) {
            return null;
        }

        const directories = this.state.items.sort((a, b) => {
            return (a.address > b.address ? 1 : (b.address > a.address ? -1 : 0));
        });
        const groupedDirectories = directories.groupBy(x => x.parentId);

        const traverseDirectories = (id, depth = 0) => {
            const children = groupedDirectories.get(id);
            if (!children) {
                return null;
            }
            return children.map((directory, i) => {
                let classes = 'tree-item';
                if (directory.get('id') === this.state.selectedDirectory) {
                    classes += ' selected';
                }
                if (directory.get('id') === this.state.focusedItem) {
                    classes += ' focused';
                }
                return (
                    <div key={i} className={classes}>
                        <div className="tree-row" style={{paddingLeft: (24*depth)+8+'px'}} onClick={this.handleClick.bind(this, directory)} onDoubleClick={this.handleDoubleClick.bind(this, directory)}>
                            <i className="tree-icon icon">file_directory</i>
                            {directory.get('name')}
                        </div>
                        {traverseDirectories(directory.get('id'), depth+1)}
                    </div>
                );
            });
        };

        return (
            <div className="directory-tree">
                <div className="tree-content" tabIndex="0">
                    {traverseDirectories(null)}
                </div>
            </div>
        );
    },
});

module.exports = Overview;
