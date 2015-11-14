"use strict";

const Reflux = require('reflux');

const actions = Reflux.createActions([
    'setCurrentDirectory',
    'setCurrentTexture',
    'setCurrentWorkspace',
    'createWorkspace',
]);

module.exports = actions;
