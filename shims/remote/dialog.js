/*jslint node:true, browser: true, esnext: true */
"use strict";

module.exports = {
    showOpenDialog(w, options) {
        document.getElementById('fileOpener').click();
    },
    showSaveDialog(w, options, callback) {
        var fileName = prompt("File Name", "");
        callback(fileName);
    }
};
