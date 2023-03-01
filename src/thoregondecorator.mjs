/**
 * Neuland Decorator wraps persistent entities
 *
 * tasks of the decorator
 * - instantiate and hold the entities object
 * - memorize where the entity is peristent
 * - keep metafdata of the entity
 * - emit entity events on behalf
 *   - collect syncs from other peers over a defined period of time
 *   - then emit 'change'
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import AccessObserver, { getAllMethodNames } from "/evolux.universe/lib/accessobserver.mjs";
// import ThoregonEntity, { ThoregonObject }    from "./thoregonentity.mjs";
import MetaClass, { ATTRIBUTE_MODE }         from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
// import SEA                                   from "/evolux.everblack/lib/crypto/sea.mjs";

import { isNil, isString, isPromise, isObject }        from "/evolux.util/lib/objutils.mjs";
import {
    isSerializedRef,
    serializeRef,
    deserializeRef,
    classOrigin,
    origin2Class,
    isThoregon,
}                   from "/evolux.util/lib/serialize.mjs";

//
// debugging & logging
//

// temp log
let logentries = [];

const debuglog = (...args) => logentries.push({ ...args }); // {}; // console.log("ThoregonDecorator", Date.now(), ":", ...args);

const isDev = () => { try { return thoregon.isDev } catch (ignore) { return false } };

//
// decorate properties and methods from decorator to apply them on the entity
//

let thoregondecoratorprops = [], thoregondecoratormethods = [];


//
//  consts
//

// all syncs within this period will be collected to one
const SYNC_CONSOLIDATION_PERIOD = 80;

const ANY_METACLASS = MetaClass.any();

//
// registry
//

const KNOWN_ENTITIES = new Map();

//
// interfaces
//

const DB   = () => universe.neuland;
const AM   = () => universe.Automerge;
const SYNC = () => universe.syncmgr;

//
// helpers
//

const ObjCls = Object.prototype.constructor;

const isPrivateProperty = (property) => !isString(property) ? true :  property.startsWith('_') || property.startsWith('$') || property.endsWith('_') || property.endsWith('$');

const isTimestamp = (property) => property === 'created' || property === 'modified' || property === 'deleted';

const shouldEmit = (property) => !(isPrivateProperty(property) || isTimestamp(property));

const hasClassReference = (obj) => !!(obj?._?.o);
const getClassReference = (obj) => obj?._?.o;


/**
 * ThoregonDecorator
 *
 * Proxy handler to work smoth with neuland entities
 */
export default class ThoregonDecorator extends AccessObserver {

    constructor(target, { parent, soul, Cls, metaClass, encrypt, decrypt, is, amdoc } = {}) {
        super(target, parent);
        Cls =  target?.constructor ?? Cls ?? ObjCls;
        metaClass = Cls.metaClass ?? metaClass ?? ANY_METACLASS;
        this.meta          = { Cls, metaClass, is };
        this._soul         = soul ?? universe.random();
        this.encrypt$      = encrypt;
        this.decrypt$      = decrypt;
        this.amdoc         = amdoc;     // Automerge document
        this._modified     = true;
        this.__x           = universe.random(5);
        this.__td          = universe.inow;
        this.__prepareMeta__();

        this._synced       = (soul, amdoc) => this.__synced__(soul, amdoc);
    }

    /**
     *
     * @param target
     * @param soul
     * @param Cls
     * @param metaClass
     * @param encrypt
     * @param decrypt
     * @param is
     * @param amdoc
     * @returns {Proxy<Object>}     decorated entity
     */
    static observe(target, { parent, soul, Cls, metaClass, encrypt, decrypt, amdoc } = {}) {
        if (target == undefined) return undefined;
        const proxy = super.observe(target, { parent, soul, Cls, metaClass, encrypt, decrypt, amdoc });
        const decorator = proxy.$access;
        if (decorator) {
            this.__addKnownEntity__(soul, proxy);
            decorator.__addSync__();
        }
        return proxy;
    }

    //
    // instances
    //

    static from(soul, { Cls, metaClass, encrypt, decrypt } = {}) {
        let entity = this.getKnownEntity(soul);
        if (entity) return entity;

        entity = this.__restore__(soul, { Cls, metaClass, encrypt, decrypt });
        return entity;
    }


    //
    // known entities
    //

    static isKnownEntity(soul) {
        return KNOWN_ENTITIES.has(soul);
    }

    static getKnownEntity(soul) {
        const entity = KNOWN_ENTITIES.get(soul);
        return entity;
    }

    static __addKnownEntity__(soul, entity) {
        KNOWN_ENTITIES.set(soul, entity);
    }

    static knownEntities() {
        return KNOWN_ENTITIES;
    }

    //
    // decorator property and method decoration (apply decorator fn on the entity)
    //

    isDecoratedProperty(name) {
        // override by subclasses when needed
        return thoregondecoratorprops.includes(name) || super.isDecoratedProperty(name);
    }

    isDecoratedMethod(name) {
        // override by subclasses when needed
        return thoregondecoratormethods.includes(name) || super.isDecoratedProperty(name);
    }

    //
    //  metadata
    //

    __prepareMeta__() {}

    get $thoregon() {
        return this;
    }

    get metaClass$() {
        return this.target?.metaClass ?? this.meta?.metaClass ?? ANY_METACLASS;
    }

    get soul() {
        return this._soul;
    }

    get materialized() {
        return DB().has(this._soul);
    }

    materialize() {
        return this.__materialize__();
    }

    //
    // INIT
    //

    __adjustTarget__(parent) {
        const target = this.target;
        parent = parent ?? target;
        // wrap all internal objects with a ThoregonDecorator
        Object.entries(target).forEach(([prop, value]) => {
            if (isObject(value) && !this.isObserved(value)) { // don't decorate already decorated entities
                value = ThoregonDecorator.observe(value, { parent, encrypt: this.encrypt$, decrypt: this.decrypt$ });
                Reflect.set(target, prop, value);
            }
        })
    }

    __init__() {
        if (this.amdoc) {
            this.__initialSync2Entity__();
        } else {
            this.__initialSync2Automerge__();
        }
    }

    //
    // properties
    //

    __attributeSpec__(prop, value) {
        return this.metaClass$?.getAttribute(prop) ?? this.__defaultAttributeSpec__(prop, value);
    }

    __defaultAttributeSpec__(prop, value) {
        const opt = { embedded: true, persistent: true };
        // todo [REFACTOR]: depending on the value differenciate the attibute type
        // now use an embedded, persistent attribute w/o additional conversions
        let attribuetSpec = ANY_METACLASS.text(prop, opt);
        return attribuetSpec;
    }

    //
    // access
    //

    doGet(target, prop, receiver) {
        let value = super.doGet(target, prop, receiver);
        if (value == undefined) {
            // check if it layz initilaized
            const ref = this.amdoc[prop];
            if (ref != undefined) {
                const propertySpec = this.__attributeSpec__(prop);
                const Cls          = propertySpec?.cls ?? ObjCls;
                const soul         = deserializeRef(ref);
                value              = ThoregonDecorator.from(soul, { Cls });
                Reflect.set(target, prop, value, receiver);
            }
        }
        return value;
    }

    doSet(target, prop, value, receiver) {
        if (value != undefined && isObject(value) && !this.isObserved(value)) value = ThoregonDecorator.observe(value, { parent: this.proxy$, encrypt: this.encrypt$, decrypt: this.decrypt$ });
        this._modified = true;
        if (value === undefined) value = null;  // Automerge can not handle undefined
        const oldvalue = Reflect.get(target, prop, receiver);
        if (value === oldvalue) return;
        (value !== null)
            ? super.doSet(target, prop, value, receiver)
            : super.doDelete(target, prop, receiver);
        this.__setAMProperty__(prop, value);
        if (this.materialized) {
            this.__materialize__();
            if (value != undefined && this.materialized) value.materialize?.();
        }
    }

    afterSet(target, prop, value, receiver) {
        const soul    = this._soul;
        const syncmgr = SYNC();
        if (syncmgr.isResponsible(soul)) {
            let samdoc = AM().merge(syncmgr.getResource(soul), this.amdoc);
            syncmgr.discover(soul, samdoc);
        } else {
            const samdoc = AM().clone(this.amdoc);
            syncmgr.discover(soul, samdoc, this._synced);
        }
    }

    doDelete(target, prop, receiver) {
        this.doSet(target, prop, null, receiver);
    }

    //
    // persistent entities
    //

    static __load__(soul) {
        let binentity = DB().get(soul);
        if (!binentity) return;
        const amdoc = AM().load(binentity);
        return amdoc;
    }

    static __entityFrom__(amdoc) {
        const origin = amdoc._?.o;
        const Cls = origin ? origin2Class(origin) : ObjCls;
        const entity = new Cls();
        return entity;
    }

    static __restore__(soul, { Cls, metaClass, encrypt, decrypt } = {}) {
        let amdoc = this.__load__(soul);
        let target = (amdoc) ? this.__entityFrom__(amdoc) : {};
        const proxy = this.observe(target, { soul, Cls, metaClass, encrypt, decrypt, amdoc });
        return proxy;
    }

    __materialize__() {
        if (this._modified) {
            const soul  = this._soul;
            const amdoc = this.amdoc;
            const bin   = AM().save(amdoc);
            DB().set(soul, bin);
            this._modified = false;
        }
        this.__materializeReferenced__();
    }

    __materializeReferenced__() {
        Object.values(this.target).forEach((value) => {
            value.materialize?.();
        })
    }

    //
    // SYNC
    //

    __initialSync2Automerge__() {
        const amdoc = AM().init();
        this.amdoc = AM().change(amdoc, (doc) => this.__syncEntity2AM__(this.target, doc));
    }

    //
    // sync thoregon entity 2 automerge
    //

    __syncEntity2AM__(from, to) {
        const origin = classOrigin(from);
        to._ = { origin };
        Object.entries(from).forEach(([prop, value]) => {
            let propertySpec = this.__attributeSpec__(prop, value);
            let toval        = to[prop];
            if (toval === value) return;  // check if some information needs to be used by the thoregon decorator
            if (isPromise(value)) {
                // value = await value; // no support for promises.
            } else if (isNil(value)) {
                if (!isNil(toval)) delete to[prop];
            } else if (isThoregon(value)) {
                // consider embedded thoregon entities in future
                const ref = serializeRef(value);
                to[prop] = ref;
            } else {
                // just use all other values.
                to[prop] = value;
            }
        })
    }

    __setAMProperty__(prop, value) {
        const amdoc = this.amdoc;
        if (isThoregon(value)) value = serializeRef(value);
        this.amdoc = AM().change(amdoc, (doc) => doc[prop] = value);
    }

    //
    // sync automerge 2 thoregon entity
    //

    __initialSync2Entity__() {
        this.__syncAM2Entity__(this.amdoc, this.target);
    }

    __syncAM2Entity__(from, to, curr) {
        const changes     = { set: [], del: [] };
        const parent      = this.$proxy;
        const entityprops = new Set(Object.keys(to));
        Object.entries(from).forEach(([prop, value]) => {
            entityprops.delete(prop);
            let propertySpec = this.__attributeSpec__(prop, value);
            if (prop === '_') return; //
            let toval = Reflect.get(to, prop);
            if (toval === value) return;
            if (isNil(value)) {
                changes.del.push({ property: prop, oldValue: Reflect.get(to, prop) });
                Reflect.deleteProperty(to, prop);
            } else if (isSerializedRef(value)) {
                const currval = curr?.[prop];
                if (value === currval) return;
                // thoregon entity -> lazy init
                changes.set.push({ property: prop, oldValue: toval });  // since new value is lazy initialized it can't be provided
            } else {
                // just use all other values.
                Reflect.set(to, prop, value);
                changes.set.push({ property: prop, oldValue: toval, newValue: value })
            }
        })

        entityprops.forEach((prop) => {
            changes.del.push({ property: prop, oldValue: Reflect.get(to, prop) });
            Reflect.deleteProperty(to, prop);
        });
        return changes;
    }

    //
    // sync manager
    //

    __addSync__() {
        const soul = this._soul;
        const samdoc = AM().clone(this.amdoc);
        SYNC().discover(soul, samdoc, this._synced);
    }

    __synced__(soul, samdoc) {
        const curram = this.amdoc;
        this.amdoc = AM().merge(this.amdoc, samdoc);
        const changes = this.__syncAM2Entity__(this.amdoc, this.target, curram);
        if (changes.set?.length > 0 || changes.del?.length > 0) this.emit('change', { property: '*', changes, obj: this.proxy$, type: 'changes', isSync: true });
    }

    //
    // logging & debugging
    //

    static getlog(filter) {
        return filter
               ? logentries.filter(filter)
               : logentries;
    }

    static clearlog() {
        logentries = [];
    }

    static dolog(...args) {
        debuglog(">", this.__x, this.__td, universe.inow, ...args);
    }

    dolog(...args) {
        debuglog(">", this.__x, this.__td, universe.inow, ...args);
    }

    static logerr(...args) {
        debuglog("E", this.__x, this.__td, universe.inow, ...args);
    }

    logerr(...args) {
        debuglog("E", this.__x, this.__td, universe.inow, ...args);
    }

}

//
// Polyfill
//

thoregondecoratormethods = getAllMethodNames(ThoregonDecorator.prototype);

