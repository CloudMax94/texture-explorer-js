const Reflux = require('reflux');

const actions = Reflux.createActions([
    'setCurrentDirectory',
    'setCurrentTexture',
    'setCurrentWorkspace',
    'createWorkspace',
    'insertData',
]);

module.exports = actions;
