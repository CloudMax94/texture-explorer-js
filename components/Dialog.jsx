'use strict';

var React   = require('react');
var Reflux  = require('reflux');

var interfaceStore  = require('../stores/interface');

var Dialog = React.createClass({
    render() {
        return (
            <div className="dialog">
                <div className="dialog-wrap">
                    <div className="dialog-close">×</div>
                    <header>About Texture Explorer.js</header>
                    <section>Website: cloudmodding.com<br/>
                        Created by CloudMax 2015.
                    </section>
                    <menu>
                        <button>Close</button>
                    </menu>
                </div>
            </div>
        );
    },
});
module.exports = Dialog;
