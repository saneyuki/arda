'use strict';

import Router from './router';
import DefaultLayout from './default-layout';

export default Object.freeze({
    contextTypes: {
        shared: React.PropTypes.any
    },

    dispatch: function (...args) {
        return this.context.shared.emit(...args);
    },

    createChildRouter: function (node) {
        let childRouter = new Router(DefaultLayout, node);
        return childRouter;
    },

    createContextOnNode: function (node, contextClass, props) {
        let childRouter = this.createChildRouter(node)
        return childRouter.pushContext(contextClass, props)
            .then((context) => Promise.resolve(context));
    },
});
