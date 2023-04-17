/**
 *
 * todo [OPEN]:
 *  - cleaup 'receivedRequests'
 *  - refactor request Q and onopen Q -> combine
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { ErrNotImplemented } from "../errors.mjs";

const debuglog = (...args) => console.log("NetworkAdapter", Date.now(), ":", ...args);

export default class NetworkAdapter {

    constructor(peerid, policy) {
        this.peerid = peerid ?? this.newPeerid();
        this.policy = policy;
        this.Q = new Map();
    }

    static newPeerid() {
        throw ErrNotImplemented("(NetworkAdapter) -> newPeerid");
    }

    newPeerid() {
        return this.constructor.newPeerid();
    }

    isApplicable(peerid) {
        return this.sameTribe(peerid);
    }

    getApplicablePeers(peerids) {
        const applicable = (peerids ?? []).filter((peerid) => this.sameTribe(peerid));
        return applicable;
    }

    sameTribe(peerid) {
        return false;
    }

    //
    // lifecycle
    //

    /**
     * just prepare this peer for communication
     * @returns {NetworkAdapter}
     */
    async prepare() {
        // implement by subclass
    }

    start() {
        // implement by subclass
    }

    pause(evt) {
        // implement by subclass
    }

    resume(evt) {
        // implement by subclass
    }

    exit() {
        // implement by subclass
    }

    //
    // communication
    //

    send(peerid, req) {
        // implement by subclass
        return this;
    }

    broadcast(data, exceptconn) {
        // implement by subclass
        return this;
    }

    discover(peerid, req) {
        // implement by subclass
        return this;
    }

    connIsReady(conn) {
        // implement by subclass
        return false;
    }

    isReady() {
        return true;
    }

    //
    // Q
    //

    needQ(conn, req) {
        if (this.connIsReady(conn)) return false;
        const Q = this.Q;
        // enqueue requests as long as the Q(ueue) exists
        let q = Q.get(conn);
        if (!q) {
            q = [];
            Q.set(conn, q);
        }
        q.push(req);
        return true;
    }

    processQ(conn) {
        const q = this.Q.get(conn);
        if (!q) return;
        q.forEach((req) => {
            try { conn.send(req) } catch (e) {}
        })
    }

    resetQ(conn) {
        this.Q.delete(conn);
    }

}
