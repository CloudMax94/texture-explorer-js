var jade = require('jade');
if (jade.renderFile) { // Browserify will not load jade and renderFile won't be present, skipping the code below.
    var html = jade.renderFile(__dirname+'/templates/interface.jade');
    document.getElementById('app').innerHTML = html;
}
require("babel/register");
require('cm-tree-view');
window.onload = function () {
    require('./lib/app.js');
};
