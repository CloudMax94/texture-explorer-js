/*jslint node:true, browser: true, esnext: true */
"use strict";

var fileOpener = document.createElement('input');
fileOpener.type = 'file';
fileOpener.id = 'fileOpener';
fileOpener.style.display = 'none';

document.body.insertBefore(fileOpener, document.body.firstChild);

module.exports = {
    showOpenDialog(w, options, callback) {
        var fileOpener = document.getElementById('fileOpener');
        fileOpener.onchange = callback;
        fileOpener.click();
    },
    showSaveDialog(w, options, callback) {
        var fileName = prompt("File Name", "");
        callback(fileName);
    }
};
