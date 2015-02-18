'use strict';

import DefaultLayout from './default-layout';
import React from 'react';
import Router from './router';

export default class Component extends React.Component {

    constructor(...args) {
        super(...args);
    }

    static get contextTypes() {
        return {
            shared: React.PropTypes.any,
        };
    }

    dispatch(...args) {
        return this.context.shared.emit(...args);
    }

    createChildRouter(node) {
        let childRouter = new Router(DefaultLayout, node);
        return childRouter;
    }

    createContextOnNode(node, contextClass, props) {
        let childRouter = this.createChildRouter(node);
        return childRouter.pushContext(contextClass, props)
            .then((context) => {
                return Promise.resolve(context)
            });
    }
}
