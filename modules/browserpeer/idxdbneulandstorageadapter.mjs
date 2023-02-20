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
        this.db = await basedb?.get(this.opt.store);
        if (!this.db) {
            this.db = new Map();
            await this.store();
        }
    }

    async store() {
        const db = this.db;
        if (!db) return;
        await basedb?.set(this.opt.store, db);
    }

}
