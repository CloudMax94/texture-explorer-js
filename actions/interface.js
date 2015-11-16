const Reflux = require('reflux');

const actions = Reflux.createActions([
    'setApplicationMenu',
    'setStatus',
    'movePanelToContainer',
    'movePanelGroupToContainer',
    'setContainerSize',
    'setTreeSize',
    'resetPanels',
]);

module.exports = actions;
