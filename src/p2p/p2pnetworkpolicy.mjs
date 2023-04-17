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

    addResourceHandler(handler, ) {
        super.addResourceHandler(handler);
        handler.isrelay = this.isrelay;
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
            case 'entities':
                this.processEntities(data, conn, adapter);
                break;
            case 'missingentities':
                this.processMissingEntities(data, conn, adapter);
                break;
            case 'useentities':
                this.processUseEntities(data);
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
        if (this.isResponsible(soul, data)) this.sendAware(data, adapter); // await this.connectSyncResource(data, conn);
    }

    dispatchDiscover(data, from) {
        this.net.forEach((adapter) => adapter.broadcast(data, from));
    }

    calcChallengeResponse(soul, challenge) {
        // hash, encrypt and sign
        return "challenge_response";
    }

    sendEntities(data) {
        const req = { ...data, cmd: 'entities' };
        this.net.forEach((adapter) => {
            const knownPeers = adapter.knownPeers;
            knownPeers.forEach((peerid) => adapter.send(peerid, req));
        });
    }

    processEntities(data, conn, adapter) {
        debuglog("processEntities", data);
        const resourceHandler = this.getResponsibleResourceHandler(undefined, data);
        if (!resourceHandler) return;
        resourceHandler.otherEntities(this, conn.peer, data.knownSouls);
    }

    sendMissingEntities(peerid, missing) {
        const req = { cmd: 'missingentities', missing };
        const adapter = this.net.find((adapter) => adapter.isApplicable(peerid));
        if (!adapter) return false;
        // todo: increment running syncs for this peer
        adapter.send(peerid, req);
    }

    processMissingEntities(data, conn, adapter) {
        debuglog("processMissingEntities", data);
        const resourceHandler = this.getResponsibleResourceHandler(undefined, data);
        if (!resourceHandler) return;
        resourceHandler.missingEntities(this, conn.peer, data.missing);
    }

    sendUseEntities(peerid, entities) {
        const req = { cmd: 'useentities', entities };
        const adapter = this.net.find((adapter) => adapter.isApplicable(peerid));
        if (!adapter) return false;
        // todo: increment running syncs for this peer
        adapter.send(peerid, req);
    }

    processUseEntities(data) {
        debuglog("processUseEntities", data);
        const resourceHandler = this.getResponsibleResourceHandler(undefined, data);
        if (!resourceHandler) return;
        resourceHandler.useEntities(data.entities);
    }

    //
    // sync
    //

    sendAware(data, adapter) {
        const req             = { ...data, cmd: 'aware' };
        const sourcepeerid    = data.source;
        const soul            = data.soul;
        const resourceHandler = this.getResponsibleResourceHandler(soul, data);
        if (!resourceHandler) return;
        adapter.send(sourcepeerid, req, () => resourceHandler.awareOut(data, this, sourcepeerid));
    }

    sendSync(cmd, data, peerid) {
        const req = { ...data, cmd };
        const adapter = this.net.find((adapter) => adapter.isApplicable(peerid));
        if (!adapter) return false;
        // todo: increment running syncs for this peer
        adapter.send(peerid, req);
    }

    syncFinished(peerid) {
        // todo:
        //  - decrement running syncs for this peer
        //  - check if no syncs and no mq is open -> close connection(s) to this peer
    }

    processAware(data, conn, adapter) {
        const { soul } = data;
        const resourceHandler = this.getResponsibleResourceHandler(soul, data);
        if (!resourceHandler) return;
        const peerid = conn.peer;
        resourceHandler.awareIn(data, this, peerid);
    }

    processSync(incomming, data, conn, adapter) {
        const { soul } = data;
        const resourceHandler = this.getResponsibleResourceHandler(soul, data);
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
        const resourceHandler = this.getResponsibleResourceHandler(soul, data);
        if (!resourceHandler) return;
        const peerid = conn.peer;
        resourceHandler.invoke(data, this, peerid);
    }

    processResult(data, conn, adapter) {
        const { soul } = data;
        const resourceHandler = this.getResponsibleResourceHandler(soul, data);
        if (!resourceHandler) return;
        const peerid = conn.peer;
        resourceHandler.result(data, this, peerid);
    }

    mqOpen(peerid) {
        // todo: increment open mq for this peer
    }

    mqFinished(peerid) {
        // todo:
        //  - decrement open mq's for this peer
        //  - check if no syncs and no mq is open -> close connection(s) to this peer
    }

}
