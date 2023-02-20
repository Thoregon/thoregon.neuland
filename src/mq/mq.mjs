/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ResourceHandler from "../resource/resourcehandler.mjs";

const MAX_DISCOVER_DELAY = 160;     // timeout in milliseconds for discover requests

export default class MQ extends ResourceHandler {

    constructor(props) {
        super(props);
        this.producers = new Map();
        this.consumers = new Map();
    }

    static setup() {
        const sync = new this();
        sync.init();
        return sync;
    }

    //
    // resource handler
    //

    isResponsible(soul) {
        return this.producers.has(soul);
    }

//
    // producers & consumers
    //

    addProducer(soul, producer) {
        this.producers.set(soul, producer);
    }

    removeProducer(soul) {
        this.producers.delete(soul);
    }

    addConsumer(soul, consumer) {
        this.consumers.set(soul, consumer);
    }

    removeConsumer(soul) {
        this.consumers.delete(soul);
    }

    getConsumer(soul) {
        let consumer = this.consumers.get(soul) ?? NeulandConsumer.from(soul);
        return consumer;
    }

    async connect(consumer) {
        return new Promise((resolve, reject) => {
            this.discover(soul);
        });
    }

    //
    // terminals
    //
    aware(data, policy, peerid) {
        // need only a driver on this side
        const { soul } = data;
        const producer = this.producers.get(soul);
        if (!producer) return;
    }

    discover(soul) {

    }
}
