'use strict';

let DefaultLayout = React.createClass({

    childContextTypes: {
        shared: React.PropTypes.any,
    },

    getChildContext: function () {
        return {
            shared: this.state.activeContext,
        };
    },

    getInitialState: function() {
        return {
            activeContext: null,
            templateProps: {},
        };
    },

    render: function() {
        if (this.state.activeContext !== null) {
            this.state.templateProps.ref = 'root';

            let ref = this.state.activeContext;
            let fn = (ref !== null) ? ref.constructor.component : null;
            return React.createFactory(fn)(this.state.templateProps);
        }
        else {
            return React.createElement('div');
        }
    },
});

export default DefaultLayout;
