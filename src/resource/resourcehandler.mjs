/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

const debuglog = (...args) => console.log("ResourceHandler", Date.now(), ":", ...args);

export default class ResourceHandler {

    init() {
        this.knownSouls = new Map();
        this.net        = universe.net;
        this._start     = (evt) => this.open();
        this._exit      = (evt) => this.close();
        universe.lifecycle.addEventListener('start', this._start);
        universe.lifecycle.addEventListener('exit', this._exit);
        // this._sync = (evt) => this.receivedSync(evt.details);
        // this._aware = (evt) => this.receivedAware(evt.details);
    }

    //
    // lifecycle
    //

    open() {
        const policies = this.net;
        for (const policy of policies) {
            policy.addResourceHandler(this);
        }
        this._started = true;
        this._ready   = policies.length;
        // this._onready?.(this);
        return this;
    }

    close() {
        const policies = this.net;
        policies.forEach((policy) => {
            policy.removeResourceHandler(this);
        });
        return this;
    }

    policyIsReady(policy) {
        // if ((--this._ready) === 0) this._onready?.(this);
    }

    discoverAvailable(policy) {
        // implement by subclass
    }

    aware(data, policy, peerid) {
        // implement by subclass
    }

    //
    // resources
    //

    isResponsible(soul) {
        return this.knownSouls.has(soul);
    }

    addResource(soul, resource, listener) {
        const knownSouls = this.knownSouls;
        if (knownSouls.has(soul)) debuglog("soul already registed", soul);
        this.setResource(soul, resource, listener);
    }

    setResource(soul, resource, listener) {
        const entry = this.getResourceEntry(soul);
        entry.resource = resource;
        if (listener != undefined) entry.listener = listener;   // don't overwrite existing listener
        this.knownSouls.set(soul, entry);
    }

    getResourceEntry(soul) {
        return this.knownSouls.get(soul) ?? {};
    }

    getResource(soul) {
        const { resource } = this.getResourceEntry(soul);
        return resource;
    }

    getListener(soul) {
        const { resource } = this.getResourceEntry(soul);
        return resource;
    }

    // another peer is aware of the resource
    resourceAware(soul, policy) {
        // implement by subclass
    }
}
