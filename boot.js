var jade = require('jade');
if (jade.renderFile) { // Browserify will not load jade and renderFile won't be present, skipping the code below.
    var html = jade.renderFile(__dirname+'/templates/interface.jade');
    document.getElementById('app').innerHTML = html;
}
require('cm-tree-view');
require("babel/register");
window.onload = function () {
    require('./lib/app.js');
};