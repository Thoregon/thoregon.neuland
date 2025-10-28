/**
 *  sync driver is a temporary context to sync entities over the network with two peers
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

const MAX_SYNC_ITERATIONS = 10;
const WAIT_SYNC_DELAY     = 100000;

const USE_WATCHDOG        = true;

const debuglog2 = (...args) => {}; // console.log("SyncDriver", universe.inow, ":", ...args); //  {};

export default class SyncDriverMsg {

    constructor(soul, entity) {
        this.soul = soul;
        this.entity = universe.Automerge.clone(entity);    // need a separate document for automerge
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
        const soul    = this.soul;
        const policy  = this.policy;
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
            // debugger;
            // return this.cancel();
            return this.syncFinished();
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
        this.policy.syncFinished(this.peerid);
        (this.incomming)
        ? this.syncmgr.syncInFinished(this)
        : this.syncmgr.syncOutFinished(this);
    }

    sendSync({ soul, msg }, policy, finished) {
        // setup watchdog to proceed to next in sync Q
        if (!finished) {
            if (USE_WATCHDOG) {
                if (this.synctimeoutid) clearTimeout(this.synctimeoutid);
                this.synctimeoutid = setTimeout(() => this.cancel(), WAIT_SYNC_DELAY);
            }
        }
        debuglog2("sendSync, set timeout", soul, this.peerid, this.synctimeoutid);
        const cmd = this.incomming ? 'syncIn' : 'syncOut';
        const wasSent = policy.sendSync(cmd, { soul, msgR: msg }, this.peerid);
    }

    cancel() {
        debuglog2("cancel");
        this.isCanceled = true;
        this.syncFinished(false);
    }

}
