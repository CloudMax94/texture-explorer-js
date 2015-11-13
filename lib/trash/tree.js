/*jslint node:true, browser: true, esnext: true */

class Tree {
    constructor() {
        this.preview = null;
        this.workspace = null;
    }
    setWorkspace(workspace) {
        this.workspace = workspace;
        document.getElementById('workspace').appendChild(this.element);
        this.element.innerHTML = '';
        this.element.appendChild(workspace.root.ele);
    }
    attachPreview(newPreview) {
        this.preview = newPreview;
    }

}

module.exports = Tree;
