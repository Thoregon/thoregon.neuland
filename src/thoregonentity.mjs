import ThoregonDecorator from "../../thoregon.archetim/lib/thoregondecorator.mjs";

/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class ThoregonEntity {


    //
    // Instantiation
    //

    /**
     * materialize - create a persistent object
     * the object is immediately persistent
     * gets a random store if store is omitted
     *
     * optionally, a store can be provided
     *
     * @param props
     * @param store     ... the store how the object can be found
     * @param inmem
     * @returns {ThoregonEntity}
     */
    static materialize(props, { store, encrypt, decrypt } = {}) {
        const instance = new this();
        const entity = instance.materialize(props,{ store, encrypt, decrypt });
        return entity;
    }

    /**
     * create - initiate an object which become persistent when
     * - it is assigned to a property of a ThoregonEntity (persistent object)
     * - if a store is provided
     * - it is stored by invoking .materialize() - gets a random store
     * @param props
     * @return {ThoregonEntity}
     */

    static create(props, { soul, encrypt, decrypt } = {}) {
        // get class for schema and instantiate
        const instance = new this();
        const entity = instance.create(props, { soul, encrypt, decrypt });
        return entity;
    }

    /**
     * get the entity either with its id or from the reference to the store
     * - always returns a thoregon entity
     * -
     *
     * if nothing exists locally
     * - a thoregon entity is returned which is not 'materialized' ->   entity.materialized() = false
     * - if a class is provided, the thoregon entity is initialized with an instance of the specified class
     *
     * @param {String} soul
     * @param {ThoregonEntity} cls
     * @param {boolean} dothrow
     * @returns {ThoregonEntity}
     */
    static from(soul, { cls, dothrow } = {}) {
        const { encrypt, decrypt } = this.getCrypto();

        // get the instance from
        const instance = universe.ThoregonDecorator.from(soul, { encrypt, decrypt, cls, dothrow });
        return instance;
    }

    //
    // initialization
    //

    /**
     * materialize - create a persistent object
     * the object is immediately persistent,
     * even if no store is provided (will get a random one)
     *
     * @param store     ... the store how the object can be found
     * @param inmem
     * @returns {Promise<*>}
     */

    async materialize(props, { store, encrypt, decrypt } = {}) {
        const { encrypt: fallbackencrypt, decrypt: fallbackdecrypt } = await this.getCrypto();
        Object.assign(this, props);

        const entity = universe.ThoregonDecorator.observe(this, { store, encrypt: encrypt ?? fallbackencrypt, decrypt: decrypt ?? fallbackdecrypt });
        await entity.__materialize__();
        return entity;
    }

    /**
     * create - initiate an object which become persistent when it is assigned
     * to a property of a ThoregonEntity (persistent object) or a store is provided
     *
     * @param props
     * @return {Promise<void>}
     */
    async create(props, { store, encrypt, decrypt } = {}) {
        const { encrypt: fallbackencrypt, decrypt: fallbackdecrypt } = await this.getCrypto();
        Object.assign(this, props);

        const entity = universe.ThoregonDecorator.observe(this, { store, encrypt: encrypt ?? fallbackencrypt, decrypt: decrypt ?? fallbackdecrypt });
        if (store) await entity.__materialize__();
        return entity;
    }

    //
    // reflection
    //

    static get metaClass() {
        return this._metaclass;
    }

    get metaClass() {
        return this.constructor.metaClass;
    }

    // this may be replaced by the firewalls in the PULS (service worker)
    static checkIn({ url } = {}, metaClass) {
        // todo [OPEN]: add the class to the known classes. needed for persistence
        this._metaclass = metaClass.getInstance();
        if (globalThis.dorifer) {
            dorifer.checkinClass(url, this, this._metaclass);
        } else {
            checkInQ.push(() => dorifer.checkinClass(url, this, this._metaclass));
        }
        // console.log("checkIn", url);
    }

    static doCheckIn() {
        checkInQ.forEach(fn => {
            try {
                fn()
            } catch (e) {
                console.log("Dorifer checkinQ", e);
            }
        });
    }

    static get $thoregonClass() {
        return true;
    }

    get $thoregonEntity() {
        return this;
    }

    //
    // logging & debugging
    //

    static getlog$() {
        return ThoregonDecorator.getlog();
    }

    static clearlog$() {
        ThoregonDecorator.clearlog()
    }

    //
    // safety & security
    //


    static getCrypto(opt) {
        // $@CRED
        // todo [OPEN]:
        //  - replace with real encryption and signing
        //  - private objects use the identities keys
        //  - shared objects use the keys from identities credentials
        const pubkey = 'THOREGON';
        const encrypt = async (item) => item;
        const decrypt = async (item) => item;
        return { encrypt, decrypt };
    }

}

//
// Polyfill
//

if (!Object.prototype.$thoregonClass) Object.defineProperty(Object.prototype, '$thoregonClass', { configurable: false, enumerable: false, writable: false, value: undefined });
if (!Object.prototype.$thoregonEntity) Object.defineProperty(Object.prototype, '$thoregonEntity', { configurable: false, enumerable: false, writable: false, value: undefined });
if (!Function.prototype.metaClass) Object.defineProperty(Function.prototype, 'metaClass', { configurable: false, enumerable: false, writable: false, value: function ({ url } = {}, metaClass) { return this._metaclass } });
if (!Function.prototype.checkIn) Object.defineProperty(Function.prototype, 'checkIn', { configurable: false, enumerable: false, writable: false, value: function ({ url } = {}, metaClass) { globalThis.dorifer?.checkinClass(url, this, metaClass) } });

//
// exports
//

export default ThoregonEntity;

export class ThoregonObject extends ThoregonEntity() {}

if (globalThis.universe) universe.$ThoregonObject = ThoregonObject;
