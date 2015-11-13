'use strict';

var React = require('react');

var TextureViewer = React.createClass({
    render() {
        return (
            <div className='texture-viewer'>
                <div className='texture-viewer-inner'>
                    <img/>
                </div>
            </div>
        );
    },
});
module.exports = TextureViewer;
