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

const DISCOVER_DELAY = 120;
const DISCOVER_SHIFT = 100;

const DB   = () => universe.neuland;

const DBGID = '-- SyncManager';
const ME = () => globalThis.me ? me : { soul: '00000000000000' };

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
        if (!universe.NO_SYNC) sync.init();
        return sync;
    }

    //
    // lifecycle
    //

    policyIsReady(policy) {
        this.rediscover(policy);
    }

    discoverAvailable(policy) {
        this.rediscover(policy);
    }

    //
    // Resources
    //

    getResource(soul) {
        let { resource } = this.getResourceEntry(soul);
        if (!resource && DB().has(soul)) resource = this.loadResource(soul);
        return resource;
    }

    loadResource(soul) {
        // if (!DB().has(soul)) return {};
        ThoregonDecorator.from(soul, { incommingSync: true });
        let { resource } = this.getResourceEntry(soul);
        return resource;
    }

    //
    // sync
    //
    isResponsible(soul, data) {
        if (!data) return DB().has(soul); //  this.knownSouls.has(soul);
        const { cmd } = data;
        return /*cmd === 'entities' || cmd === 'missingentities' || cmd == 'useentities' ||*/ DB().has(soul); // this.knownSouls.has(soul);
    }

    awareOut(data, policy, peerid) {
        // need only a driver on this side
        const { soul } = data;
        const itemkey = `${peerid}.${soul}`;
        const entity = this.getResource(soul);
        if (!entity) return;
        let driver = this.syncOutQ[itemkey];
        if (driver) driver.cancel(); // running but outdated
        universe.debuglog(DBGID, "awareOut", soul);
        driver = this.syncOutQ[itemkey] = Driver.outgoing(this, soul/*, entity*/, policy, peerid);
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
        universe.debuglog(DBGID, "awareIn", soul);
        driver = this.syncInQ[itemkey] = Driver.incomming(this, soul/*, entity*/, policy, peerid);
        driver.drive();
    }

    syncIn(data, policy, peerid) {
        const { soul } = data;
        const itemkey = `${peerid}.${soul}`;
        let driver  = this.syncInQ[itemkey];
        if (!driver) return;
        universe.debuglog(DBGID, "syncIn", soul);
        driver.sync(data, policy, peerid);
    }

    syncOut(data, policy, peerid) {
        const { soul } = data;
        const itemkey = `${peerid}.${soul}`;
        let driver  = this.syncOutQ[itemkey];
        universe.debuglog(DBGID, "syncOut", soul);
        if (!driver) driver = this.syncOutQ[itemkey] = Driver.outgoing(this, soul, undefined, policy, peerid);
        driver.sync(data, policy, peerid);
    }

    /**
     * the sync of the resource with the other peer is done
     * @param soul
     * @param entity
     */
    syncInFinished(driver) {
        this.syncFinished(driver, this.syncInQ);
        universe.debuglog(DBGID, "syncInFinished", driver?.soul);
    }

    syncOutFinished(driver) {
        this.syncFinished(driver, this.syncOutQ);
        universe.debuglog(DBGID, "syncOutFinished", driver?.soul);
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
            universe.debuglog(DBGID, "Can't merge", curentity, driver.entity);
        }
    }

    emitResourceChanged(soul, amdoc) {
        const { listener } = this.getResourceEntry(soul);
        try { listener?.(soul, amdoc) } catch (e) { universe.debuglog(DBGID, "ERROR, resource sync listener", e) };
/*
        if (this.isrelay && !listener) {
            try {
                const bin   = Automerge.save(amdoc);
                DB().set(soul, bin);
            } catch (e) {
                universe.debuglog(DBGID, "emitResourceChanged: can't store", e);
            }
        }
*/
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
     * @param {Object} opt
     */
    discover(soul, entity, listener, opt = {}) {
        // build the following:
        // - with the credential (in opt) encrypt and sing the request
        // - add a challenge the responder must resolve (?)
        if (entity != undefined) this.setResource(soul, entity, listener, opt);
        const policy = undefined;   // todo if needed
        universe.debuglog(DBGID, "discover", soul);
        if (!opt.incommingSync) this.discoverQ.discover(soul, entity, policy, opt);
        // this._discover(soul, entity, opt);
    }

    _discover({ soul, policy, opt } = {}) {
        const policies = this.net;
        const req = { soul };  // todo [OPEN]: need credential
        if (policy) return policy.sendDiscover(req, opt);
        policies.forEach((policy) => policy.sendDiscover(req, opt));
        universe.debuglog(DBGID, "_discover", soul);
    }

    rediscover(policy, opt) {
        if (!policy.canDiscover()) return;
        if (this.isrelay) return;
        const knownSouls = [...this.knownSouls.keys()]; // [...DB().keys()]; // [...universe.ThoregonDecorator.knownEntities().keys()]
        universe.debuglog(DBGID, "rediscover");
        // this.entities(policy, knownSouls);
        // [...knownSouls].forEach((soul) => this.discover(soul, undefined, opt));
    }

    entities(policy, knownSouls, opt) {
        const req = { knownSouls };
        policy.sendEntities(req, opt);
    }

    otherEntities(policy, peerid, knownSouls) {
        const missing = knownSouls.filter(soul => !DB().has(soul));
        universe.debuglog(DBGID, "otherEntities", missing);
        // policy.sendMissingEntities(peerid, missing);
    }

    missingEntities(policy, peerid, missing) {
        const entites = {};
        missing.forEach(soul => entites[soul] = DB().get(soul));
        // policy.sendUseEntities(peerid, entites);
    }

    useEntities(entities) {
        return;
/*
        universe.debuglog(DBGID, "useEntities");
        Object.entries(entities).forEach(([soul, buf]) => {
            if (soul === ME().soul) {
                debugger;
            } else if (!DB().has(soul)) {
                const bin = new Uint8Array(buf);
                DB().set(soul, bin);
            }
        });
*/
    }

    //
    // resources
    //

    setResource(soul, resource, listener, opt) {
        universe.debuglog(DBGID, "setResource", soul);
        return super.setResource(soul, resource, listener);
    }

    dropResource(soul) {
        universe.debuglog(DBGID, "dropResource", soul);
        super.dropResource(soul);
    }

    getAMDoc(soul) {
        const entity = ThoregonDecorator.getKnownEntity(soul);
        if (!entity) return;
        const amdoc = entity.$amdocsave();
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
        universe.debuglog(DBGID, "discover delay", soul);
    }

    shift(pending4soul, soul, entity, policy, opt) {
        const { fn, timeout } = pending4soul;
        clearTimeout(timeout);
        pending4soul.timeout = setTimeout(fn, DISCOVER_SHIFT);
        universe.debuglog(DBGID, "discover shift", soul);
    }
}
