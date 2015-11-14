'use strict';

const React = require('react');

const TextureViewer = React.createClass({
    render() {
        return (
            <div className="texture-viewer">
                <div className="texture-viewer-inner">
                    <img/>
                </div>
            </div>
        );
    },
});
module.exports = TextureViewer;
