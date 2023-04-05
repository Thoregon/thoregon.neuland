/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import NetworkPolicy        from "../network/networkpolicy.mjs";

const debuglog = (...args) => {} // console.log("P2PNetworkPolicy", universe.inow, ":", ...args);  // {}
const debugerr = (...args) => console.error("P2PNetworkPolicy", universe.inow, ":", ...args);

export default class P2PNetworkPolicy extends NetworkPolicy {

    constructor(opt) {
        super(opt);
    }

    init() {
        // this.peers4souls = new Map();  // sync peer connections for a soul
        super.init();
        this._awareQ = [];
        this.isrelay = universe.netconfig.p2p.relay ?? false;
    }

    //
    // lifecycle
    //

    prepare(evt) {
        const adaptertypes = universe.netconfig.p2p.adapters;
        this.net = adaptertypes.map((Adapter) => new Adapter(this, this.opt));
        this._ready = this.net.length;
        this.net.forEach((adapter) => adapter.prepare(() => this.adapterReady(adapter)));
    }

    pause(evt) {
        // currently don't stop backgroud sync
    }

    resume(evt) {
        // discover again, there may be new peers to sync with
    }

    exit(evt) {
        this.net?.forEach((adapter) => adapter.exit());
    }

    //
    // loop control
    //

    usedDiscoverId(reqid) {
        this.receivedRequests.set(reqid, Date.now());   // don't answer request comming from myself
    }

    wasReceived(data) {
        if (!data) return true;
        if (data.cmd !== 'discover') return false;  // only discover requests must be checked. other messages may be the same
        const reqid = data.reqid;
        if (this.receivedRequests.has(reqid)) return true;
        this.receivedRequests.set(reqid, Date.now());
        return false;
    }

    //
    //
    //

    received(data, conn, adapter) {
        // check command coming from other peer
        const cmd = data.cmd;
        if (!cmd) return;
        switch (cmd) {
            case 'syncIn':
            case 'syncOut':
                // check if I have the requested resource id, otherwise ignore
                this.processSync(cmd === 'syncIn', data, conn, adapter);
                break;
            case 'invoke':
                this.processInvoke(data, conn, adapter);
                break;
            case 'result':
                this.processResult(data, conn, adapter);
                break;
            default:
                super.received(data, conn, adapter);
                break;
        }
    }

    //
    // discover
    //

    async processDiscover(data, conn, adapter) {
        // todo: check signature, decrypt
        const { soul, source } = data;
        if (this.isOwnAdapter(source)) return;  // was my own request, don't dispatch again
        // send to know peers except the requester
        if (this.isrelay) this.dispatchDiscover(data, conn);
        // check if I have the requested resource id
        if (this.isResponsible(soul)) this.sendAware(data, adapter); // await this.connectSyncResource(data, conn);
    }

    dispatchDiscover(data, from) {
        this.net.forEach((adapter) => adapter.broadcast(data, from));
    }

    calcChallengeResponse(soul, challenge) {
        // hash, encrypt and sign
        return "challenge_response";
    }

    //
    // sync
    //

    sendAware(data, adapter) {
        const req             = { ...data, cmd: 'aware' };
        const sourcepeerid    = data.source;
        const soul            = data.soul;
        const resourceHandler = this.getResponsibleResourceHandler(soul);
        if (!resourceHandler) return;
        adapter.send(sourcepeerid, req, () => resourceHandler.awareOut(data, this, sourcepeerid));
    }

    sendSync(cmd, data, peerid) {
        const req = { ...data, cmd };
        const adapter = this.net.find((adapter) => adapter.isApplicable(peerid));
        if (!adapter) return false;
        adapter.send(peerid, req);
    }

    processAware(data, conn, adapter) {
        const { soul } = data;
        const resourceHandler = this.getResponsibleResourceHandler(soul);
        if (!resourceHandler) return;
        const peerid = conn.peer;
        resourceHandler.awareIn(data, this, peerid);
    }

    processSync(incomming, data, conn, adapter) {
        const { soul } = data;
        const resourceHandler = this.getResponsibleResourceHandler(soul);
        if (!resourceHandler) return;
        const peerid = conn.peer;
        // this.addPeer4Soul(soul, { adapter, peerid });
        (incomming)
            ? resourceHandler.syncIn(data, this, peerid)
            : resourceHandler.syncOut(data, this, peerid)
    }

    //
    // MQ
    //

    sendInvoke(soul, req, peerid) {
        const wreq = { soul, req, cmd: 'invoke' };
        const adapter = this.net.find((adapter) => adapter.isApplicable(peerid));
        if (!adapter) return false;
        adapter.send(peerid, wreq);
    }

    sendResult(soul, data, peerid) {
        const req = { soul, data, cmd: 'result' };
        const adapter = this.net.find((adapter) => adapter.isApplicable(peerid));
        if (!adapter) return false;
        adapter.send(peerid, req);
    }

    processInvoke(data, conn, adapter) {
        const { soul } = data;
        const resourceHandler = this.getResponsibleResourceHandler(soul);
        if (!resourceHandler) return;
        const peerid = conn.peer;
        resourceHandler.invoke(data, this, peerid);
    }

    processResult(data, conn, adapter) {
        const { soul } = data;
        const resourceHandler = this.getResponsibleResourceHandler(soul);
        if (!resourceHandler) return;
        const peerid = conn.peer;
        resourceHandler.result(data, this, peerid);
    }

}
