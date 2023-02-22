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
import ThoregonEntity, { ThoregonObject }    from "./thoregonentity.mjs";
import MetaClass                             from "../../thoregon.archetim/lib/metaclass/metaclass.mjs";

const debuglog = (...args) => console.log("ThoregonDecorator", Date.now(), ":", ...args);
const debugerr = (...args) => console.error("ThoregonDecorator", Date.now(), ":", ...args);

// all syncs within this period will be collected to one
const SYNC_CONSOLIDATION_PERIOD = 80;

const ANY_METACLASS = MetaClass.any();

// all instantiated entities
const KNOWN_ENTITIES = new Map();

const DB = universe.neuland;

/********************************************************************************************************/

const isPrivateProperty = (property) => !isString(property) ? true :  property.startsWith('_') || property.startsWith('$') || property.endsWith('_') || property.endsWith('$');

const isTimestamp = (property) => property === 'created' || property === 'modified' || property === 'deleted';

const shouldEmit = (property) => !(isPrivateProperty(property) || isTimestamp(property));

/********************************************************************************************************/

export default class ThoregonDecorator extends AccessObserver {

    constructor(target, parent, { store, cls, metaClass, encrypt, decrypt }) {
        super(target, parent);
        this.meta          = { metaClass };
        this.encrypt$      = encrypt;
        this.decrypt$      = decrypt;
        this.__x           = universe.random(5);
        this.__td          = universe.inow;
        this.__prepareMeta__();
    }

    static observe(target, { store, cls, metaClass, parent, encrypt, decrypt } = {}) {
        const proxy = super.observe(target, parent, { store, cls, metaClass, encrypt, decrypt });
        return proxy;
    }

    static from(root, { cls = Object.prototype.constructor, metaClass, parent, encrypt, decrypt } = {}) {
        const _metaClass = metaClass;
        const entity = this.getKnownEntity(root);
        if (entity) return entity;

        let target;
        let binentity = DB.get(root);
        if (!binentity) {

        }
    }

    static isKnownEntity(root) {
        return KNOWN_ENTITIES.has(root);
    }

    static getKnownEntity(root) {
        const entity = KNOWN_ENTITIES.get(root);
        return entity;
    }

    static addKnownEntity(root, entity) {
        // MISSING_ROOTS.delete(root);
        KNOWN_ENTITIES.set(root, entity);
    }

    static knownEntities() {
        return KNOWN_ENTITIES;
    }

}
