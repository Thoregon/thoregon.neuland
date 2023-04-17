/**
 * sync driver is a temporary context to sync entities over the network with two peers
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

const WAIT_SYNC_DELAY     = 100000;
const USE_WATCHDOG        = true;

const debuglog2 = (...args) => {}; // console.log("SyncDriver", universe.inow, ":", ...args); //  {};

export default class SyncDriverMerge {

    constructor(soul/*, entity*/) {
        this.soul   = soul;
        // this.entity = entity;   // no clone needed!
        // this.entity = universe.Automerge.clone(entity);    // need a separate document for automerge
    }


    static outgoing(syncmgr, soul/*, entity*/, policy, peerid) {
        debuglog2("outgoing", peerid);
        const driver     = new this(soul/*, entity*/);
        driver.incomming = false;
        driver.syncmgr   = syncmgr;
        driver.setup(policy, peerid);
        return driver;
    }

    static incomming(syncmgr, soul/*, entity*/, policy, peerid) {
        debuglog2("incomming", peerid);
        const driver     = new this(soul/*, entity*/);
        driver.incomming = true;
        driver.syncmgr   = syncmgr;
        driver.setup(policy, peerid);
        return driver;
    }

    setup(policy, peerid) {
        this.policy = policy;
        this.peerid = peerid;
    }

    drive() {
        const soul    = this.soul;
        const policy  = this.policy;
        const bin     = this.syncmgr.getAMBin(soul);
        if (!bin) {
            this.cancel();
            return;
        }
        const msg     = bin.buffer;
        debuglog2("drive", this.peerid);
        this.sendSync({ soul, msg }, policy);
        if (USE_WATCHDOG) {
            if (this.synctimeoutid) clearTimeout(this.synctimeoutid);
            this.synctimeoutid = setTimeout(() => this.cancel(), WAIT_SYNC_DELAY);
        }
        // this.syncFinished();
    }

    sendSync({ soul, msg }, policy) {
        debuglog2("sendSync", soul, this.peerid);
        const cmd = this.incomming ? 'syncOut' : 'syncIn';
        const wasSent = policy.sendSync(cmd, { soul, msg }, this.peerid);
    }

    sync({ soul, msg }, peerid) {
        if (this.isCanceled) return;
        const bin = new Uint8Array(msg);
        try {
            const doc   = universe.Automerge.load(bin);
            this.entity = doc;
        } catch (e) {
            this.tainted = true;
            console.log("AM can't load binary", soul, e);
        }
        this.syncFinished();
    }

    syncFinished() {
        debuglog2("syncFinished");
        // this.policy.closePeerConnection(this.peerid);
        this.policy?.syncFinished(this.peerid);
        if (this.incomming) {
            this.syncmgr.syncInFinished(this);
        } else {
            this.syncmgr.syncOutFinished(this);
        }
    }

    cancel() {
        debuglog2("cancel");
        this.isCanceled = true;
        this.syncFinished(false);
    }
}
