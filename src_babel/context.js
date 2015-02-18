'use strict';

import EventEmitter from './event-emitter';

// Context mixin React.Component
export default class Context extends EventEmitter {
    // ##### Properties #####
    // # static contextType: Object
    // # props: Props
    // # state: State
    // # _component: Component
    // ######################
    constructor(component, props) {
        super();
        this._component = component;
        this.props = props;
        this._onDisposes = [];

        let ref = this.constructor.subscribers;
        let subscribers = !!ref ? ref : [];

        this.delegate((eventName, callback) =>{
            if (!!callback) {
                return this.on(eventName, callback);
            }
            else {
                if (typeof Rx === 'undefined' || Rx === null) {
                    throw new Error('you need callback as second argument if you don\'t have Rx');
                }
                return Rx.Node.fromEvent(this, eventName);
            }
        });
    }

    dispose() {
        return Promise.all(this._onDisposes);
    }

    getActiveComponent() {
        return this._component.refs.root;
    }

    delegate(subscribe) {
        let tmp = this.constructor.subscribers;
        let subscribers = !!tmp ? tmp : [];
        subscribers.forEach((subscriber) => {
            subscriber(this, subscribe);
        });
    }

    // # (State => State)? => Promise<void>
    update(stateFn = null) {
        let val = ((this.state === null) && this.props) ?
            Promise.resolve(this.initState(this.props)).then((state) => {
                this.state = state;
                return Promise.resolve();
            }) :
            null;
        return Promise.resolve(val).then(() => {
            let nextState = (stateFn !== null) ? stateFn(this.state) : this.state;
            // # ignore undefined
            if (!!nextState) {
                this.state = nextState;
            }
            return this.expandComponentProps(this.props, this.state);
        }).then((templateProps) => {
            this._component.setState({
                activeContext: this,
                templateProps: templateProps
            });
        });
    }

    //# Override
    //# Props -> Promise<State>
    initState(props) {
        return props;
    }

    // # Override
    // # Props, State -> Promise<ComponentProps>
    expandComponentProps(props, state) {
        return props;
    }

    // # Override
    // # Register
    render(templateProps = {}) {
        let component = React.createFactory(this.constructor.component)
        return component(templateProps)
    }

    // # Props => ()
    // # Update internal props and state
    _initByProps(props) {
        this.props = props;
        return new Promise((resolve) => {
            Promise.resolve(this.initState(this.props)).then((state) => {
                this.state = state;
                resolve();
            });
        });
    }
}
