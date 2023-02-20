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

// all syncs within this period will be collected to one
const SYNC_CONSOLIDATION_PERIOD = 80;

// all instantiated entities
const ENTITIES = new Map();

export default class ThoregonDecorator {

}
