/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

const debuglog = (...args) => {}; // console.log("NetworkPolicy", Date.now(), ":", ...args);

export default class NetworkPolicy {

    constructor(opt) {
        this.opt = opt;
        this.init();
    }

    init() {
        this.listeners        = {};
        this.resourcehandlers = [];
        this.activeSync       = new Map();
        this.receivedRequests = new Map();  // during uptime received requests over all adapters
        this.net              = undefined;               // must be initialized by subclass
        this._prepare         = (evt) => this.prepare(evt);
        this._exit            = (evt) => this.exit(evt);
        universe.lifecycle.addEventListener('prepare', this._prepare);
        universe.lifecycle.addEventListener('exit', this._exit);
    }

    //
    // lifecycle
    //

    prepare(evt) {
        // implement by subclass
    }

    start(evt) {
        // implement by subclass
    }

    pause(evt) {
        // implement by subclass
    }

    resume(evt) {
        // implement by subclass
    }

    exit(evt) {
        // implement by subclass
    }

    adapterReady(adapter) {
        if ((--this._ready) === 0) {
            this.resourcehandlers.forEach((handler) => handler.policyIsReady(this));
        }
    }

    connectionEstablished(conn, adapter) {
        this.resourcehandlers.forEach((resourcehandler) => resourcehandler.discoverAvailable(this));
    }



    //
    // resources
    //

    getCredentialRef() {
        return "credential";
    }

    getPeerids4(soul) {
        return (this.peers4souls.get(soul) ?? [])
                    .map((tupel) => tupel.peerid);
    }

    //
    // networking
    //

    sendDiscover(req) {
        const adapters = this.net;
        req = { ...req, cmd: 'discover', reqid: universe.random(), c: this.getCredentialRef() };
        this.usedDiscoverId(req.reqid);
        adapters.forEach((adapter) => {
            req.source = adapter.peerid;
            adapter.broadcast(req)
        });
    }

    usedDiscoverId(id) {}

    isOwnAdapter(source) {
        const foundadapter = this.net.find((adapter) => adapter.peerid === source);
        return foundadapter;
    }

    received(data, conn, adapter) {
        // check command coming from other peer
        const cmd = data.cmd;
        if (!cmd) return;
        switch (cmd) {
            case 'discover':
                this.processDiscover(data, conn, adapter);
                break;
            case 'aware':
                // the other peer is aware of the resource
                this.processAware(data, conn, adapter);
                break;
            case 'syncIn':
            case 'syncOut':
                // check if I have the requested resource id, otherwise ignore
                this.processSync(cmd === 'syncIn', data, conn, adapter);
                break;
            case 'invoke':
                break;
            case 'result':
                break;
            default:
                break;
        }
    }

    processDiscover(data, conn, adapter) {
        // implement by subclass
    }

    processAware(data, conn, adapter) {
        // implement by subclass
    }

    wasReceived(data) {
        return false;
    }

    //
    // resource handler
    //

    addResourceHandler(handler, ) {
        this.resourcehandlers.push(handler);
    }

    removeResourceHandler(handler) {
        this.resourcehandlers = this.resourcehandlers.filter((reghandler) => reghandler != handler);
    }

    getResponsibleResourceHandler(soul) {
        const handler = this.resourcehandlers.find((handler) => handler.isResponsible?.(soul));
        return handler;
    }

    isResponsible(soul) {
        const handler = this.getResponsibleResourceHandler(soul);
        return handler != undefined;
    }

    //
    // event listeners
    //

    emitEvent(eventname, details, { once = false } = {}) {
        let listeners = this.eventlisteners[eventname];
        if (!listeners) return;
        if (once) delete this.eventlisteners[eventname];
        listeners.forEach((fn) => {
            try { fn({ event: eventname, details }) } catch (e) { debuglog("emit event", e) }
        })
    }

    addEventListener(eventname, fn) {
        let listeners = this.eventlisteners[eventname];
        if (!listeners) listeners = this.eventlisteners[eventname] = [];
        listeners.push(fn);
        return this;
    }

    removeEventListener(eventname, fn) {
        let listeners = this.eventlisteners[eventname];
        if (!listeners) return;
        this.eventlisteners[eventname] = listeners.filter((listener) => listener != fn);
        return this;
    }

}
