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

import ResourceHandler from "../resource/resourcehandler.mjs";

const debuglog = (...args) => {}; // console.log("Sync", universe.inow, ":", ...args);   //  {};
const debuglog2 = (...args) => {}; // console.log("SyncDriver", universe.inow, ":", ...args); //  {};

const MAX_SYNC_ITERATIONS =   10;
const WAIT_SYNC_DELAY     = 150;

export default class SyncManager extends ResourceHandler {

    constructor(opt) {
        super(opt);
        this.opt      = opt;
        this.syncInQ  = {};
        this.syncOutQ = {};
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
        driver = this.syncOutQ[itemkey] = SyncDriver.outgoing(this, soul, entity, policy, peerid);
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
        this.syncInQ[itemkey] = SyncDriver.incomming(this, soul, entity, policy, peerid);
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

    syncFinished(driver, Q) {
        const soul = driver.soul;
        const peerid = driver.peerid;
        const itemkey = `${peerid}.${soul}`;
        delete Q[itemkey];
        if (driver.isCanceled) return;
        let curentity = this.getResource(soul);
        const entity = universe.Automerge.merge(curentity, driver.entity); // there may be syncs in between, so merge it
        this.setResource(soul, entity); // Automerge entities are immutable, this is a modified one -> replace it
        this.emitResourceChanged(soul);
    }

    emitResourceChanged(soul) {
        const { resource, listener } = this.getResourceEntry(soul);
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
        this._discover(soul, entity, opt);
    }

    _discover(soul, entity, policy, opt) {
        const policies = this.net;
        const req = {  soul };  // todo [OPEN]: need credential

        let discoverQ = this._discoverQ;
        if (!discoverQ) discoverQ = this._discoverQ = [];
        discoverQ.push(((policy, req, opt) => (() => {
            if (policy) return policy.sendDiscover(req, opt);
            policies.forEach((policy) => policy.sendDiscover(req, opt));
        }))(policy, req, opt));

        if (this._discoverWaitId) clearTimeout(this._discoverWaitId);

        debuglog("discover", soul);

        this._discoverWaitId = setTimeout(() => {
            let discoverQ = this._discoverQ;
            if (!discoverQ) return;
            let fn;
            while (fn = discoverQ.shift()) {
                fn();
            }
        }, WAIT_SYNC_DELAY);
    }

    rediscover(policy, opt) {
        if (!policy.canDiscover()) return;
        const knownSouls = this.knownSouls;
        debuglog("rediscover");
        knownSouls.forEach((entity, soul) => this._discover(soul, entity, policy, opt));
    }
}

/**
 * sync driver is a temporary context to sync entities over the network with two peers
 */
class SyncDriver {

    constructor(soul, entity) {
        this.soul = soul;
        const doc = universe.Automerge.init();
        this.entity = universe.Automerge.merge(doc, entity);    // need a separate document for automerge
    }

    static outgoing(syncmgr, soul, entity, policy, peerid) {
        debuglog2("outgoing", peerid);
        const driver     = new this(soul, entity);
        driver.incomming = false;
        driver.syncmgr   = syncmgr;
        driver.setup(policy, peerid);
        return driver;
    }

    static incomming(syncmgr, soul, entity, policy, peerid) {
        debuglog2("incomming", peerid);
        const driver     = new this(soul, entity);
        driver.incomming = true;
        driver.syncmgr   = syncmgr;
        driver.setup(policy, peerid);
        return driver;
    }

    drive() {
        const soul          = this.soul;
        const policy        = this.policy;
        const { msg } = this.syncState;
        debuglog2("drive", this.peerid);
        this.sendSync({ soul, msg }, policy);
    }

    setup(policy, peerid) {
        this.policy  = policy;
        this.peerid  = peerid;
        this.siter   = MAX_SYNC_ITERATIONS;
        const [sync, msg]   = universe.Automerge.generateSyncMessage(this.entity, universe.Automerge.initSyncState());
        this.syncState = { sync, msg };
    }

    sync({ soul, msgR }, peerid) {
        if (this.isCanceled) return;
        if (this.synctimeoutid) {
            clearTimeout(this.synctimeoutid);
            debuglog2("clear timeout", this.synctimeoutid);
        }
        debuglog2("sync (received)", soul, peerid);
        // sanity check
        if (soul !== this.soul) debugger;
        if (msgR) {
            debuglog2("receiveSyncMessage");
            msgR = new Uint8Array(msgR);
            let [entity, syncL] = universe.Automerge.receiveSyncMessage(this.entity, this.syncState.sync, msgR);
            this.syncState.sync = syncL;
            this.entity = entity;
        }
        const [syncL, msgL] = universe.Automerge.generateSyncMessage(this.entity, this.syncState.sync);
        debuglog2("generateSyncMessage");
        this.syncState = { sync: syncL, msg: msgL };
        if (!this.siter--) {
            debugger;
            return this.cancel();
        }
        const policy = this.policy;
        debuglog2("sendSync iteration");
        const finished = (!msgR && !msgL);
        this.sendSync({ soul, msg: msgL ?? false }, policy, finished);
        if (finished) this.syncFinished();
    }

    syncFinished() {
        debuglog2("syncFinished");
        // this.policy.closePeerConnection(this.peerid);
        (this.incomming)
            ? this.syncmgr.syncInFinished(this)
            : this.syncmgr.syncOutFinished(this);
    }

    sendSync({ soul, msg }, policy, finished) {
        // setup watchdog to proceed to next in sync Q
        if (!finished) this.synctimeoutid = setTimeout(() => this.cancel(), WAIT_SYNC_DELAY);
        debuglog2("sendSync, set timeout", soul, this.peerid, this.synctimeoutid);
        const cmd = this.incomming ? 'syncOut' : 'syncIn';
        const wasSent = policy.sendSync(cmd, { soul, msgR: msg }, this.peerid);
    }

    cancel() {
        debuglog2("cancel");
        this.isCanceled = true;
        this.syncFinished(false);
    }

}
