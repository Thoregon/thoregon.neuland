/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import NeulandStorageAdapter from "../../src/storage/neulandstorageadapter.mjs";
import { BaseDB }            from "/evolux.universe/lib/reliant/basedb.mjs";

let basedb;

const DBGID = '** NeulandDB';

export default class IDXDBNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ store, name } = {}) {
        this.opt = { store, name };
        basedb = new BaseDB(name, name);
        basedb._init();
    }

    //
    // storage
    //

    async load() {
        universe.debuglog(DBGID, "IDX Adapter load");
        this.db = await basedb?.get(this.opt.store);
        universe.debuglog(DBGID, "IDX Adapter load DONE");
        if (!this.db) {
            universe.debuglog(DBGID, "IDX Adapter new Map");
            this.db = new Map();
            await this.store();
            universe.debuglog(DBGID, "IDX Adapter new DONE");
        }
    }

    async store() {
        const db = this.db;
        if (!db) return;
        universe.debuglog(DBGID, "IDX Adapter stored");
        await basedb?.set(this.opt.store, db);
        universe.debuglog(DBGID, "IDX Adapter store DONE");
    }

}
