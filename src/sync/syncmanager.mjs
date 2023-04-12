/**
 *
 *
 * todo [open]:
 *  - better handshake between peers when both start same sync
 *  - check if syncIn and syncOut needs to be distinguised
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ResourceHandler   from "../resource/resourcehandler.mjs";
import Driver            from "./syncdrivermerge.mjs";
import ThoregonDecorator from "/thoregon.archetim/lib/thoregondecorator.mjs";
import policy            from "../../../thoregon.truCloud/lib/application/policy.mjs";

// import Driver         from "./syncdrivermsg.mjs";

const debuglog = (...args) => {}; // console.log("Sync", universe.inow, ":", ...args);   //  {};
const debuglog2 = (...args) => {}; // console.log("SyncDriver", universe.inow, ":", ...args); //  {};

const DISCOVER_DELAY = 120;
const DISCOVER_SHIFT = 100;

export default class SyncManager extends ResourceHandler {

    constructor(opt) {
        super(opt);
        this.opt       = opt;
        this.syncInQ   = {};
        this.syncOutQ  = {};
        this.discoverQ = new DiscoverQ(this);
    }

    static setup() {
        const sync = new this();
        sync.init();
        return sync;
    }

    //
    // lifecycle
    //

    policyIsReady(policy) {
        this.rediscover(policy);
    }

    //
    // sync
    //
    awareOut(data, policy, peerid) {
        // need only a driver on this side
        const { soul } = data;
        const itemkey = `${peerid}.${soul}`;
        const entity = this.getResource(soul);
        if (!entity) return;
        let driver = this.syncOutQ[itemkey];
        if (driver) driver.cancel(); // running but outdated
        driver = this.syncOutQ[itemkey] = Driver.outgoing(this, soul, entity, policy, peerid);
        driver.drive();
    }

    /**
     * a sync request was received from another peer.
     * sync only with the requesting peer
     * @param data
     * @param policy
     * @param peerid
     */
    awareIn(data, policy, peerid) {
        // need only a driver on this side
        const { soul } = data;
        const itemkey = `${peerid}.${soul}`;
        const entity = this.getResource(soul);
        if (!entity) return;
        let driver  = this.syncInQ[itemkey];
        if (driver)  driver.cancel(); // running but outdated
        driver = this.syncInQ[itemkey] = Driver.incomming(this, soul, entity, policy, peerid);
        driver.drive();
    }

    syncIn(data, policy, peerid) {
        const { soul } = data;
        const itemkey = `${peerid}.${soul}`;
        let driver  = this.syncInQ[itemkey];
        if (!driver) return;
        driver.sync(data, policy, peerid);
    }

    syncOut(data, policy, peerid) {
        const { soul } = data;
        const itemkey = `${peerid}.${soul}`;
        let driver  = this.syncOutQ[itemkey];
        if (!driver) return;
        driver.sync(data, policy, peerid);
    }

    /**
     * the sync of the resource with the other peer is done
     * @param soul
     * @param entity
     */
    syncInFinished(driver) {
        this.syncFinished(driver, this.syncInQ);
    }

    syncOutFinished(driver) {
        this.syncFinished(driver, this.syncOutQ);
    }

    syncFinished(driver, Q, out) {
        const soul = driver.soul;
        const peerid = driver.peerid;
        const itemkey = `${peerid}.${soul}`;
        delete Q[itemkey];
        if (driver.isCanceled) return;
        try {
            this.emitResourceChanged(soul, driver.entity);
        } catch (e) {
            debuglog("Can't merge", curentity, driver.entity);
        }
    }

    syncFinished_(driver, Q, out) {
        const soul = driver.soul;
        const peerid = driver.peerid;
        const itemkey = `${peerid}.${soul}`;
        delete Q[itemkey];
        if (driver.isCanceled) return;
        let curentity = this.getResource(soul);
        try {
            if (curentity === driver.entity) return;    // no merge, same object
            const entity = curentity ? universe.Automerge.merge(curentity, driver.entity) : driver.entity; // there may be syncs in between, so merge it
            this.setResource(soul, entity); // Automerge entities are immutable, this is a modified one -> replace it
            this.emitResourceChanged(soul);
        } catch (e) {
            debuglog("Can't merge", curentity, driver.entity);
        }
    }

    emitResourceChanged(soul, resource) {
        const { listener } = this.getResourceEntry(soul);
        try { listener?.(soul, resource) } catch (e) { debuglog("ERROR, resource sync listener", e) };
    }

    //
    // communication
    //

    /**
     * this is the first sync where the other peers are not known.
     * therefore the request must be encrypted and signed, only the
     * receivers knowing the credential can respond
     * @param {String} soul  resource id
     * @param {Object} entity
     * @param {Object} listener
     */
    discover(soul, entity, listener, opt) {
        // build the following:
        // - with the credential (in opt) encrypt and sing the request
        // - add a challenge the responder must resolve (?)
        if (entity != undefined) this.setResource(soul, entity, listener);
        const policy = undefined;   // todo if needed
        this.discoverQ.discover(soul, entity, policy, opt);
        // this._discover(soul, entity, opt);
    }

    _discover({ soul, policy, opt } = {}) {
        const policies = this.net;
        const req = { soul };  // todo [OPEN]: need credential
        if (policy) return policy.sendDiscover(req, opt);
        policies.forEach((policy) => policy.sendDiscover(req, opt));
        debuglog("discover", soul);
        console.log(">> discover", soul);
    }

    rediscover(policy, opt) {
        if (!policy.canDiscover()) return;
        const knownSouls = this.knownSouls;
        debuglog("rediscover");
        [...knownSouls.keys()].forEach((soul) => this.discover(soul, undefined, opt));
    }

    //
    // resources
    //

    getAMDoc(soul) {
        const entity = ThoregonDecorator.getKnownEntity(soul);
        if (!entity) return;
        const amdoc = entity.$amdocsafe();
        return amdoc;
    }

    getAMBin(soul) {
        const entity = ThoregonDecorator.getKnownEntity(soul);
        if (!entity) return;
        const amdoc = entity.$ambinsafe();
        return amdoc;
    }
}

class DiscoverQ {

    constructor(sync) {
        this.sync = sync;
        this.pending = new Map();
    }

    discover(soul, entity, policy, opt) {
        const pending4soul = this.pending.get(soul);
        if (pending4soul) {
            this.shift(pending4soul, soul, entity, policy, opt);
        } else {
            this.delay(soul, entity, policy, opt);
        }
    }

    doDiscover(what) {
        const soul = what.soul;
        this.pending.delete(soul);
        this.sync._discover(what);
    }

    delay(soul, entity, policy, opt) {
        const what = { soul, entity, policy, opt };
        const fn = ((args) => () => this.doDiscover(args))(what);
        const pending4soul = { what, fn, timeout: setTimeout(fn, DISCOVER_DELAY) };
        this.pending.set(soul, pending4soul);
        console.log(">> discover delay", soul);
    }

    shift(pending4soul, soul, entity, policy, opt) {
        const { fn, timeout } = pending4soul;
        clearTimeout(timeout);
        pending4soul.timeout = setTimeout(fn, DISCOVER_SHIFT);
        console.log(">> discover shift", soul);
    }
}
