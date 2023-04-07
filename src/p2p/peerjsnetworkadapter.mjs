/**
 *
 * todo [OPEN]
 *  - handle also connection state to the signalling server (peer.on 'disconnected'
 *  - handle peer.destroyed -> open new Peer
 *  - (review) heartbeat: node peerjs does not close wrtc connections on exit
 *  - if no connection can be made, try TURN server -> https://peerjs.com/docs
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import NetworkAdapter from "../network/networkadapter.mjs";

const HEARTBEAT              = false;
const TRIBE_PREFIX           = 'PeerJS-';
const HEARTBEAT_INTERVAL     = 3000;
const RECONNECT_INTERVAL     = 3000;
const RETRY_CONNECT_INTERVAL = 300;

// simulated import. will be set when the instance is created
let Peer;

const debuglog = (...args) => {}; // console.log("PeerJSNetworkAdapter", Date.now(), ":", ...args);
const debugerr = (...args) => console.error("PeerJSNetworkAdapter", universe.inow, ":", ...args);

const debuglog2 = (...args) => {}; // onsole.log("PeerJSNetworkAdapter", universe.inow, ":", ...args);

const isConnOpen = (conn) => conn?.open && conn?.peerConnection.connectionState === 'connected';

export default class PeerJSNetworkAdapter extends NetworkAdapter {

    constructor(policy) {
        const peerid = `${TRIBE_PREFIX}${universe.netconfig?.peerid ?? universe.random()}`;
        super(peerid, policy);
        this.knownPeers = universe.netconfig.p2p.knownPeers;
        Peer            = universe.Peer;
        this._onopen    = [];
    }

    sameTribe(peerid) {
        return peerid?.startsWith(TRIBE_PREFIX);
    }

    //
    // state & management
    //

    //
    // lifecycle
    //

    addOnOpen(fn) {
        if (fn) this._onopen.push(fn);
    }

    // just create the communication peer with an id
    // todo [OPEN]:
    //  - add watchdog, after timeout reject()
    //  - add 'retry' loop, maybe currently the network is unavailable -> listen to network status
    /*async*/ prepare(onopen) {
        return new Promise((resolve) => {
            const peeropt = universe.netconfig?.p2p?.signaling ?? {};
            const peer    = new Peer(this.peerid, peeropt);
            this.addOnOpen(onopen);

            peer.on('open', (id) => {
                debuglog2('My peer ID is: ' + id);
                if (!this.peerid) this.peerid = id;
                this.monitorKnownPeers();
                this.openAchieved();
                resolve(this);
            });

            peer.on('connection', (conn) => {
                debuglog('peer connection');
                this.useConnection(conn);
            });

            peer.on('call', (evt) => {
                debuglog('peer call', evt);
            });

            peer.on('close', (evt) => {
                debuglog('peer close', this.peerid);
            });

            peer.on('disconnected', (evt) => {
                debuglog('peer disconnected', this.peerid);
                try {
                    if (peer.destroyed) {
                        if (this._maintaintimeoutid) clearTimeout(this._maintaintimeoutid);
                        this.maintainPeer(true);
                    } else {
                        this.peer.reconnect();
                    }
                } catch (e) { debugerr("Can't reconnect peer", e) }
            });

            peer.on('error', (err) => {
                switch (err.type) {
                    case 'peer-unavailable':
                        const message     = err.message;
                        const i           = message.lastIndexOf(' ') + 1;
                        const otherPeerId = message.substring(i);
                        setTimeout(() => this.reconnectConnection(otherPeerId), RECONNECT_INTERVAL);
                        break;
                    case 'unavailable-id':
                        if (this._maintaintimeoutid) clearTimeout(this._maintaintimeoutid);
                        this.maintainPeer(true);
                        break;
                    default:
                        debugerr('peer error', err.message);
                        break;
                }
            });

            this.peer = peer;
        });
    }

    start() {
        // connect to all known peers
        this.connectKnownPeers(this.knownPeers);
    }

    pause(evt) {

    }

    resume(evt) {

    }

    exit() {
        this._stopping = true;
        try {
            if (!this.peer) return;
            const peerconns = this.peer.connections;
            Object.entries(peerconns).forEach(([peeris, conns]) => {
                conns.forEach((conn) => conn.close());
            })
            this.peer?.destroy();
        } catch (e) {
            debugerr("error during quit", e.message);
        } finally {
            this._stopping = false;
        }
    }

    //
    // management
    //

    maintainPeer(force = false) {
        if (!force && this.peer?.open) return false;
        try {
            const peer = this.peer;
            if (peer) {
                peer.disconnect();
                peer.destroy()
            }
        } catch (e) {
            debugerr("Error terminating peer", e);
        }
        try {
            this.peer = undefined;
            this.prepare();
        } catch (e) {
            debugerr("Error reconnecting peer", e);
        }
        return true;
    }

    connectKnownPeers(knownPeers) {
        knownPeers = knownPeers ?? [...this.knownPeers];
        knownPeers?.forEach((peerid) => this.connect(peerid, (conn) => {
            this.openAchieved();
            this.established(conn);
        }));
    }

    monitorKnownPeers() {
        try {
            if (this.maintainPeer()) {
                // the peer restarts, monitorKnownPeers loop will also be restarted
                if (this._maintaintimeoutid) clearTimeout(this._maintaintimeoutid);
                return;
            }

            this._maintaintimeoutid = setTimeout(() => {
                this.monitorKnownPeers();
            }, RECONNECT_INTERVAL);

            this.maintainAllPeerConnections();
            const knownPeers = this.knownPeers;
            const peerconns  = this.peer.connections ?? [];
            const remaining  = new Set(knownPeers);
            knownPeers?.forEach((peerid) => {
                const conns = peerconns[peerid];
                if (!conns || conns.length === 0) return;
                const conn = conns.find((conn) => isConnOpen(conn));
                if (!conn) return;
                remaining.delete(peerid);
            });
            this.connectKnownPeers([...remaining.values()]);
        } catch (e) {
            debugerr("moitorKnownPeers", e);
        }
    }

    reconnectPeer(onopen) {
        const peer = this.peer;
        if (peer.open) return onopen(this);
        this.addOnOpen((adapter) => {
            debuglog("peer reconnected", adapter.peerid);
            onopen?.(adapter);      // well, adapter should be 'this'
        });
        try {
            if (peer.destroyed) {
                this.prepare();
            } else {
                peer.reconnect()
            }
        } catch (e) { debugerr("Can't reconnect peer", e) };
    }

    reconnectConnection(peerid) {
        this.connect(peerid, (conn) => this.established(conn))
    }

    // at least one known peer must be connected
    openAchieved() {
        const fns = this._onopen;
        this._onopen = [];
        fns?.forEach((fn) => {
            try {fn(this)} catch (e) { debugerr("on open error", e)}
        })
    }

    established(conn) {
        this.processQ(conn);
        this.policy.connectionEstablished(conn, this);
        this.startHeartbeat(conn);
    }

    connect(otherPeerId, onopen) {
        const peer = this.peer;
        if (peer.disconnected) return this.reconnectPeer(() => this.connect(otherPeerId, onopen));
        this.maintainPeerConnections(otherPeerId);
        let conn = this.getOpenConnection(otherPeerId);
        if (conn) return onopen?.(conn);  // connection already established
        try {
            conn = peer.connect(otherPeerId);
            this.useConnection(conn, otherPeerId, onopen);
        } catch (e) {
            setTimeout(() => {
                this.reconnectPeer(() => this.connect(otherPeerId, onopen));
            }, RETRY_CONNECT_INTERVAL);
        }
        return this;
    }

    getOpenConnection(peerid) {
        const conns = this.peer?.connections?.[peerid] ?? [];
        const conn = conns.find((conn) => isConnOpen(conn));
        return conn;
    }

    maintainPeerConnections(peerid) {
        try { this.peer?.connections?.[peerid]?.filter((conn) => !isConnOpen(conn)).forEach((conn) => conn.close());} catch (ignore) { }
        try {
            const conns = this.peer?.connections?.[peerid]?.filter((conn) => !isConnOpen(conn));
            conns.pop(); // leave last (latest) opened connection
            conns.forEach((conn) => conn.close());
        } catch (ignore) { }
    }

    maintainAllPeerConnections() {
        const peerids = Object.keys(this.peer?.connections ?? {});
        peerids.forEach((peerid) => this.maintainPeerConnections(peerid));
    }

    useConnection(conn, otherPeerId, onopen) {
        otherPeerId = otherPeerId ?? conn.peer;
        conn.on('open', (evt) => {
            debuglog2('conn opened from', otherPeerId);
            // if (allConns[otherPeerId] != undefined) debuglog(`!! Peer '${otherPeerId}' was connected before !!`);
            conn.on('data', (data) => {
                // debuglog('Received', data);
                this.process(data, conn);
            });
            onopen?.(conn);
        });

        conn.on('close', (evt) => {
            debuglog('conn closed', conn.peer);
            this.handleConnectionClose(conn);
        })

        conn.on('error', (err) => {
            debugerr('conn error', conn.peer, err);
            this.handleConnectionClose(conn);
        })
    }

    handleConnectionClose(conn) {
        const peerid = conn.peer;
        try { conn.close()} catch (ignore) { }
        this.resetQ(conn);
        // this.policy.removePeer4Souls(conn);
        // if the peer was one of the 'knownPeers' start 'try reconnect'
        if (!this.knownPeers?.includes(peerid)) return;
        this.reconnectConnection(peerid);
    }

    send(otherPeerId, req, cb) {
        const conn = this.getOpenConnection(otherPeerId);
        if (!conn || !isConnOpen(conn)) {
            this.connect(otherPeerId, (conn) => {
                conn.send(req);
                cb?.(conn);
            });
        } else {
            conn.send(req);
            cb?.(conn);
        }
    }

    //
    // info
    //

    connIsReady(conn) {
        // todo [?]: check also if connection has failed?
        return isConnOpen(conn) ?? false;
    }

    getOpenConnections() {
        const connsperpeer = this.peer.connections;
        const openconns    = [];
        Object.values(connsperpeer).forEach(pconns => openconns.push(...(pconns.filter(pconn => isConnOpen(pconn)))));
        return openconns;
    }

    isReady() {
        return this.peer?.open ?? false;
    }

    //
    // communication
    //

    broadcast(data, exceptconn) {
        const peerconns = this.peer.connections;
        Object.entries(peerconns).forEach(([peeris, conns]) => {
            conns.forEach((conn) => {
                if (conn === exceptconn) return;  // don't send request back
                if (isConnOpen(conn)) conn.send(data);
            })
        })
        return this;
    }


    //
    // processing
    //

    process(data, conn) {
        // sanity
        if (!data || typeof data !== 'object') return;

        // check if this request has been received before, if yes ignore
        if (this.policy.wasReceived(data)) {
            debuglog("request rejected", data);
            return;
        }

        debuglog("received", conn.peer, data?.cmd);
        // check command coming from other peer
        const cmd = data.cmd;
        if (!cmd) return;
        switch (cmd) {
            case 'heart':
                this.processHeart(conn);
                break;
            case 'beat':
                this.processBeat(conn);
                break;
            default:
                this.policy.received(data, conn, this);
                break;
        }
    }


    //
    // heartbeat
    //

    sendHeart(conn) {
        conn.send({ cmd: 'heart'});
    }

    processHeart(conn) {
        conn.send({ cmd: 'beat'});
    }

    processBeat(conn) {

    }

    startHeartbeat(conn) {
        if (!HEARTBEAT) return;
        setTimeout(() => {
            if (!isConnOpen(conn)) return;
            this.sendHeart(conn);
            this.startHeartbeat(conn);
        }, HEARTBEAT_INTERVAL);
    }

}
