/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { timeout }     from "/evolux.universe";
import ResourceHandler from "../resource/resourcehandler.mjs";
import Facade          from "/thoregon.crystalline/lib/facade.mjs";
import NeulandProducer from "/thoregon.crystalline/lib/producers/neulandproducer.mjs";
import NeulandConsumer from "/thoregon.crystalline/lib/consumers/neulandconsumer.mjs";

const WAIT_MQ_DELAY      = 1;

export default class MQ extends ResourceHandler {

    constructor(props) {
        super(props);
        this.producers = new Map();
        this.consumers = new Map();
        this.services  = new Map();
    }

    static setup() {
        const sync = new this();
        sync.init();
        return sync;
    }

    //
    // resource handler
    //

    isResponsible(soul, data) {
        const { cmd } = data;
        return this.producers.has(soul) || (cmd !== 'discover' && this.consumers.has(soul));
    }

    //
    // producers & consumers
    //

    async consumerFor(soul, retry = 3) {
        try {
            return await this.getService(soul);
        } catch (e) {
            if (--retry <= 0) throw e;
            await timeout(300);
            return await this.consumerFor(soul, retry);
        }
    }

    addProducer(soul, service, contextwrapper) {
        const producer = NeulandProducer.at(soul, service, contextwrapper);
        this.producers.set(soul, producer);
        producer.mq = this;
        return service;
    }

    removeProducer(soul) {
        this.producers.get(soul)?.close();
        this.producers.delete(soul);
    }

    addConsumer(soul, consumer) {
        this.services.set(soul, consumer);
    }

    removeConsumer(soul) {
        this.services.delete(soul);
    }

    async getService(soul) {
        let service = this.services.get(soul);
        if (!service) {
            let consumer = this.consumers.get(soul);
            if (!consumer) {
                let consumer = NeulandConsumer.from(soul);
                this.consumers.set(soul, consumer);
                let facade = service = await Facade.use(consumer);
                this.services.set(soul, facade);
            } else {
                await this.wait4Consumer(soul, consumer);
                if (!service) service = this.services.get(soul);
            }
        }

        return service;
    }

    /*async*/ wait4Consumer(soul, consumer) {
        return new Promise(async (resolve, reject) => {
            consumer.addInitQ(resolve);
        })
    }

    // async connect(consumer) {
    //     return new Promise((resolve, reject) => {
    //         this.discover(soul);
    //     });
    // }

    //
    // terminals
    //
    awareOut(data, policy, peerid) {
        // nothing to do, producer is ready
        // const { soul } = data;
        // const producer = this.producers.get(soul);
        // if (!producer) return;
        // producer.open = true;
    }

    /**
     * Q with the specified soul has been found
     *
     * This may be called multiple times depending on the number of agents providing this Q.
     * Choose one, in this case the first which answers.
     *
     * @param data
     * @param policy
     * @param peerid
     */
    awareIn(data, policy, peerid) {
        const { soul } = data;
        const consumer = this.consumers.get(soul);
        if (!consumer) return;
        setTimeout(() => consumer.connected(data, policy, peerid), WAIT_MQ_DELAY);
    }

    discover(soul, policy) {
        const policies = this.net;
        const req = {  soul };  // todo [OPEN]: need credential

        if (policy) return policy.sendDiscover(req);
        policies.forEach((policy) => policy.sendDiscover(req));
    }

    sendInvoke(soul, req, policy, peerid) {
        policy.sendInvoke(soul, req, peerid);
    }

    invoke(data, policy, peerid) {
        const { soul } = data;
        // const itemkey = `${peerid}.${soul}`;
        const producer = this.producers.get(soul);
        const req = data.req;
        producer.handleRequest(soul, req, policy, peerid);
    }

    sendResult(soul, data, policy, peerid) {
        policy.sendResult(soul, data, peerid);
    }

    result(data, policy, peerid) {
        const { soul } = data;
        // const itemkey = `${peerid}.${soul}`;
        const consumer = this.consumers.get(soul);
        consumer.handleResponse(data);
    }
}
