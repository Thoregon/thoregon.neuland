/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import NetworkAdapter from "../networkadapter.mjs";

const debuglog = (...args) => {}; // console.log("$$ ChannelRelayAdapter", universe.inow, ":", ...args); // console.log("P2PNetworkPolicy", universe.inow, ":", ...args);  // {}
const debugerr = (...args) => console.error("$$ ChannelRelayAdapter", universe.inow, ":", ...args);

const TRIBE_PREFIX = 'PeerJS-';

export default class ChannelRelayAdapter extends NetworkAdapter {

    constructor(policy) {
        const peerid = undefined; // `${TRIBE_PREFIX}${universe.netconfig?.peerid ?? universe.random()}`;  // don't build a peerid because the peerid from the relayed adapter must be used!
        super(peerid, policy);
        this._policy          = policy;
        this._relayready      = false;
        this._Q               = [];
        this.receivedRequests = new Map();  // during uptime received requests over all adapters
        this.setupRelay();
        debuglog("created");
    }

    sameTribe(peerid) {
        return peerid?.startsWith(TRIBE_PREFIX);
    }

    //
    // relay
    //

    setupRelay() {
        window.addEventListener('message', (evt) => this.relayReceived(evt));
        this._relay = window.top;
        this._relay.postMessage({ type: 'netrelay', cmd: 'channelReady' }, '*');
    }

    relayReceived(evt) {
        if (evt?.data?.type !== 'netrelay') return;
        const data   = evt.data;
        const req    = data.req;
        const cmd    = req.cmd;
        const subreq = req.data;
        const from   = req.from;
        const conn   = { id: req.conn, peer: from };
        debuglog("relayReceived", cmd, req);
        switch (cmd) {
            case 'relayReady':
                this._relayready = true;
                this.peerid = req.peerid;
                this._onopen?.(this);
                break;
            case 'connectionEstablished':
                this.connectionEstablished(conn, this);
                break;
            case 'wasReceived':
                this.wasReceived(subreq);
                break;
            case 'received':
                this.received(subreq, conn, this);
        }
    }

    send2Relay(cmd, req, meta) {
        if (!this.relayReady()) {
            if (this._Q) this._Q.push({ cmd, req, meta });
            return;
        }
        this._relay.postMessage({ type: 'netrelay', cmd, req, meta }, '*');
        debuglog("send2Relay", cmd, req, meta);
    }

    processQ() {
        const Q = this._Q;
        delete this._Q;
        Q.forEach((relay) => this.send2Relay(...relay));
        debuglog("processQ");
    }

    relayReady() {
        return this._relayready;
    }

    //
    // relay API to channel (policy)
    //

    connectionEstablished(conn, adapter) {
        this._policy.connectionEstablished(conn, adapter);
    }

    wasReceived(data) {
        this._policy.wasReceived(data);
    }

    received(data, conn, adapter) {
        this._policy.received(data, conn, adapter);
    }

    //
    // relay API to channel (adapter)
    //

    prepare(onopen) {
        if (this._relayready) return onopen(this);
        this._onopen = onopen;
    }

    exit() {}

    isApplicable(peerid) {
        return true;
    }

    canDiscover() {
        return this.relayReady(); // todo: maybe it is ready before (
    }

    broadcast(req, exceptconn) {
        this.send2Relay('broadcast', req, exceptconn);
    }

    send(otherPeerId, req, cb) {
        const conn = { id: 1, peer: otherPeerId };
        this.send2Relay('send', req, otherPeerId);
        cb?.(conn);
    }


}
