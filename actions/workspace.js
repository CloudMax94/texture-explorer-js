/*jslint node:true, browser: true, esnext: true */
"use strict";

var React  = require('react/addons');
var Reflux = require('reflux');

var actions = Reflux.createActions([
    "setCurrentDirectory",
    "setCurrentTexture",
    "setCurrentWorkspace",
    "createWorkspace",
]);

module.exports = actions;
