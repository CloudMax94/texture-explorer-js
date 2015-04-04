/*jslint node:true, browser: true */
"use strict";

module.exports = {
    showOpenDialog: function(w, options) {
        document.getElementById('fileOpener').click();
    },
    showSaveDialog: function(w, options, callback) {
        var fileName = prompt("File Name", "");
        callback(fileName);
    }
};