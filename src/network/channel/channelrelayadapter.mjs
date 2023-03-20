/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import NetworkAdapter from "../networkadapter.mjs";

const TRIBE_PREFIX = 'PeerJS-';

export default class ChannelRelayAdapter extends NetworkAdapter {

    constructor(policy) {
        super();
        const peerid = `${TRIBE_PREFIX}${universe.netconfig?.peerid ?? universe.random()}`;
        super(peerid, policy);
        this._policy = policy;
        this.setupRelay();
    }

    sameTribe(peerid) {
        return peerid?.startsWith(TRIBE_PREFIX);
    }

    ready() {
        // relay peerjs adapter is ready
    }

    //
    // relay
    //

    setupRelay() {
        window.addEventListener('message', (evt) => this.relayReceived(evt));
        this._relay = window.top;
        this._relay.postMessage({ type: 'netrelay', cmd: 'channelReady' });
    }

    relayReceived(evt) {
        console.log("ChannelRelay received:", evt);
        debugger;
    }

    //
    // relay API to channel (adapter)
    //

    connectionEstablished(conn, adapter) {
    }

    wasReceived(data) {
    }

    received(data, conn, adapter) {
    }


}
