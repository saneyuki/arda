'use strict';

import EventEmitter from './event-emitter';
import React from 'react';

export default class Router extends EventEmitter {
    //React.Class * ?HTMLElement => Router
    constructor(layoutComponent, el = null) {
        super();
        this.el = el;
        this._locked = false;
        this._disposers = [];
        this.history = [];
        this._rootComponent = null;
        this.innerHTML = '';

        if (!!el) {
            let Layout = React.createFactory(layoutComponent);
            this._rootComponent = React.render(Layout(), el);
            this._rootComponent.isRoot = true;
        }
    }

    // # () => boolean
    isLocked() {
        return this._locked;
    }

    dispose() {
        let disposed = this._disposers.map(function (disposer) {
            return disposer();
        });
        return Promise.all(disposed).then(() => {
            return new Promsie((resolve) => {
                let popUntilBlank = () => {
                    if (this.history.length > 0) {
                        return this.popContext().then(function() {
                            return popUntilBlank();
                        });
                    } else {
                        resolve();
                    }
                };
                return popUntilBlank();
            }).then(() => {
                this.diposed = true;
                this._lock = true;
                this.history = null
                this._disposers = null;
                this.removeAllListeners();
                Object.freeze(this);
                if (!!this.el) {
                    React.unmountComponentAtNode(this.el);
                }
                this.emit('router:disposed');
            });
        });
    }

    pushContextAndWaitForBack(contextClass, initialProps = {}) {
        return new Promise((resolve) => {
            return this.pushContext(contextClass, initialProps).then((context) => {
                context.on('context:disposed', resolve);
                return context;
            });
        });
    }

    // # typeof Context => Thenable<Boolean>
    pushContext(contextClass, initialProps = {}) {
        this._lock();

        //# check
        let lastContext = this.activeContext;
        if (!!lastContext) {
            lastContext.emit('context:paused');
        }

        this.activeContext = new contextClass(this._rootComponent, initialProps);
        return this._mountToParent(this.activeContext, initialProps)
            .then(() =>{
                this.history.push({
                    name: contextClass.name,
                    props: initialProps,
                    context: this.activeContext,
                });
                this._unlock();
                this.activeContext.emit('context:created');
                this.activeContext.emit('context:started');
                this.emit('router:pushed', this.activeContext);
            }).then(() => {
                return this.activeContext;
            });
    }

    // # () => Thenable<void>
    popContext() {
        if (this.history.length <= 0) {
            throw 'history stack is null';
        }

        this._lock();
        this.history.pop();

        //# emit disposed in context.dispose
        let lastContext = this.activeContext;
        let val = !!lastContext ? this._disposeContext(lastContext) : null;
        return Promise.resolve(val)
            .then(() => {
                let last = this.history[this.history.length - 1];
                this.activeContext = !!last ? last.context : null;
                if (this.activeContext !== null) {
                    this._mountToParent(this.activeContext, this.activeContext.props);
                }
                else {
                    this._unmountAll();
                }
            }).then(() => {
                if (!!this.activeContext) {
                    this.activeContext.emit('context:started');
                    this.activeContext.emit('context:resumed');
                    this.emit('router:popped', this.activeContext);
                }
                else {
                    this.emit('router:blank');
                }
                this._unlock();
            }).then(() => {
                return this.activeContext;
            });
    }

    // # () => Thenable<Context>
    replaceContext(contextClass, initialProps = {}) {
        if (this.history.length <= 0) {
            throw 'history stack is null';
        }
        this._lock();

        let lastContext = this.activeContext;
        let val = !!lastContext ? this._disposeContext(lastContext) : null;
        return Promise.resolve(val)
            .then(() => {
                this.activeContext = new contextClass(this._rootComponent, initialProps);
                this.activeContext.emit('context:created');
                this.activeContext.emit('context:started');
                this._mountToParent(this.activeContext, initialProps);
            }).then(() => {
                this.history.pop();
                this.history.push({
                    name: contextClass.name,
                    props: initialProps,
                    context: this.activeContext,
                });
                this._unlock();
                this.emit('router:replaced', this.activeContext);
            }).then(() => {
                return this.activeContext;
            });
      }

    // #  Context * Object  => Thenable<void>
    _mountToParent(context, initialProps) {
        return this._initContextWithExpanding(context, initialProps)
            .then((templateProps) => {
                return this._outputByEnv(context, templateProps);
            });
    }

    // #  () => Thenable<void>
    _unmountAll() {
        return this._outputByEnv(null);
    }

    // #  React.Element => Thenable<void>
    _outputByEnv(activeContext, props) {
        if (!!this.el) {
            return this._outputToDOM(activeContext, props);
        }
        else {
            return this._outputToRouterInnerHTML(activeContext, props);
        }
    }

    _outputToDOM(activeContext, props) {
        this._rootComponent.setState({
            //# activeContext: activeContext?.render(props)
            activeContext: activeContext,
            templateProps: props,
        });
    }

    // # For test dry run
    _outputToRouterInnerHTML(activeContext, templateProps) {
        if (activeContext) {
            let factory = React.createFactory(activeContext.constructor.component);
            let rendered = factory(templateProps);
            this.innerHTML = React.renderToString(rendered);
        }
        else {
            this.innerHTML = '';
        }
        return this.innerHTML;
    }

    _unlock() {
        return this._locked = false;
    }

    _lock() {
        return this._locked = true;
    }

    _disposeContext(context) {
        delete context.props;
        delete context.state;
        context.emit('context:disposed');
        if (typeof context.removeAllListeners === 'function') {
            context.removeAllListeners();
        }
        context.dispose();
        context.disposed = true;
        return Object.freeze(context);
    }

    _initContextWithExpanding(context, props) {
        return context._initByProps(props)
            .then(() => {
                return context.expandComponentProps(context.props, context.state);
            });
    }
}
