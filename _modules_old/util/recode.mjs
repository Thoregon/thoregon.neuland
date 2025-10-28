/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import fs              from "fs/promises";
import { deserialize } from "v8";
import path            from "path";
import { Automerge }   from "/thoregon.neuland/modules/nodepeer/automerge.mjs";
import { timeout }     from "/evolux.universe";

import { isPrivateProperty, isString } from "/evolux.util/index.mjs";

import Directory             from "/thoregon.archetim/lib/directory.mjs";
import SelfSovereignIdentity from "/thoregon.identity/lib/selfsovereignidentity.mjs";
// import AppInstance           from "/thoregon.truCloud/lib/application/appinstance.mjs";

const OMIT_APP_ENTITIES = new Set([/*'checkoutSessions', 'checkoutSession', */'agents', 'mediathek', 'devices', 'test', 'channels']);

// special handling
// - CheckoutSession
// - UnifiedFileDescriptior
async function recreateEntity(entity, olddb, { done, prevsoul } = {}) {
    if (!done) done = new Map();
    const soul = entity.$soul;
    if (done.has(soul)) return done.get(soul);

    /*
    let recreated;
    if (entity.$origin) {
        const soul = entity.$soul;
        const Cls = await getClass(entity.$origin);
        recreated = Cls.create({}, { soul });
    } else {
        recreated = { ...properties };
    }
   */
    const recreated =  soul ? { $soul: soul, $origin: entity.$origin } : {};
    if (soul) done.set(soul, recreated);
    // console.log("-- Recreate", soul, entity.$origin);
    if (entity.$origin === 'repo:/thoregon.truCloud/lib/unifiedfile/unifiedfiledescriptor.mjs:UnifiedFileDescriptor') {
        // debugger;
        return; // { UFD: true };
    } else if (entity.$origin === 'repo:/easypay-checkout-session/checkoutsession.mjs:CheckoutSession') {
        // debugger;
        return; // { CheckoutSession: true };
    } else if (entity.$origin.indexOf('PaymentPlanDefinition') > -1) {
        recreated.$origin = 'repo:/easypay-module-paymentplan/paymentplansinglepayment.mjs:PaymentPlanSinglePayment';
    }

    const propnames = getPropertiesToInclude(entity).filter((property) => !OMIT_APP_ENTITIES.has(property));
    for await (const property of propnames) {
        const propval = entity[property];
        const { soul, origin } = getSoul(propval);
        if (!soul) {
            // simple property, just copy
            recreated[property] = propval;
        } else {
            const refentity = getRefEntity(propval, olddb);
            const entity = await recreateEntity(refentity, olddb, { done });
            if (entity != undefined) recreated[property] = entity;
        }
        // console.log("-- Set prop", property);
    }

    return recreated;
}

async function recreateMediathek(identity, olddb) {
    // mediathek
    const mediathek = getRefEntity(identity.mediathek, olddb);
    if (!mediathek || !mediathek.cids) {
        console.log("Mediathek not recreated");
        return;
    }
    const cidsrefs  = getRefEntity(mediathek.cids, olddb);
    const cids      = getPropertiesToInclude(cidsrefs);
    debugger;
}

async function buildMediathek(mediathek) {

}

export default async (prevanchor, anchor, dbpath, recodefn) => {
    console.log("$$ Recode DB", anchor);
    try {
        // nexus: ./datatest/neuland_nexus_2024_10_12.tdb
        // erika: ./datatest/neuland_2024-10-08_093153_407.tdb
        const filepath = path.resolve(dbpath);     //  neuland_am.tdb
        const bindb      = await fs.readFile(filepath);
        const olddb       = deserialize(bindb);

        console.log("-- DB loaded");

        if (!olddb.has(prevanchor)) {
            console.error(">> Anchor could not be loaded");
            return;
        }

        const neulandDB = new Map();

        let bin = olddb.get(prevanchor);
        const identity = Automerge.load(bin)
        if (!identity) {
            console.error(">> Identiy could not be loaded");
            return;
        }
        identity.$soul = anchor;
        identity.$origin = 'repo:/thoregon.identity/lib/selfsovereignidentity.mjs';

        console.log("-- Identiy");
        const done = new Map();
        const prevssi= await recreateEntity(identity, olddb, { done });
        const ssi = await recodefn(prevssi);
        await ssi.materialize();
        await timeout(600);
//        console.log("-- Mediathek");
//        const mediathek = await recreateMediathek(identity, olddb);
    } catch (e) {
        console.error('>> ERROR', e, e.stack);
    } finally {
        console.log("$$ Recode DB END");
    }
}

//
// utils & helpers
//

function getSoul(str) {
    if (!str || !isString(str)) return {};
    const parts = str.split('|');
    if (parts.length === 0) return {};     // empty strings as undefined
    const selector = parts[0].substring(2);    // caution: because the 's͛' is a combined char it is 2 chars long
    if (selector !== 'T') return {};
    const soul   = parts[1];
    const origin = parts[2];
    return { soul, origin };
}

function getEntity(soul, db) {
    let bin = db.get(soul);
    const entity = Automerge.load(bin)
    return entity;
}

function getRefEntity(ref, db) {
    const { soul, origin } = getSoul(ref);
    if (!soul) return;
    const entity = getEntity(soul, db);
    if (!entity) {
        console.error(">> Soul not found", soul, origin);
        return;
    }
    entity.$soul   = soul;
    entity.$origin = origin;
    return entity;
}

const EXCLUDED_PROPERTIES = new Set(['created', 'modified', 'metaclass', 'metaClass']);

function getPropertiesToInclude(entity) {
    return Object.keys(entity).filter((property) => !(isPrivateProperty(property) || EXCLUDED_PROPERTIES.has(property)));
}

async function getClass(ref){
    let clspath = ref.substring(5);
    const i = clspath.indexOf(':');
    let clsname = 'default';
    if (i > -1) {
        clspath = clspath.substring(0,i);
        clsname = clspath.substring(i+1);
    }
    const module = await import(clspath);
    const Cls = module[clsname] ?? module.default;
    return Cls;
}


// **********************************************************************

async function __recreateIdentity(identity, olddb) {
    // apps
    const apps              = getRefEntity(identity.apps, olddb);

    // upayme dashboard app
    const appdashboardentry = getRefEntity(apps['easypay-application-dashboard'], olddb);
    const appdashboard      = getRefEntity(appdashboardentry.dashboard, olddb);
    const AppClass          = await getClass(appdashboard.$origin);
    const root              = getRefEntity(appdashboard.root, olddb);
    const extroot           = getRefEntity(appdashboard.extendedroot, olddb);

    // get essential app entities from root
    // -> storeSettings, products, ipns, customers, credentials, coupons, contentlinks
    const storeSettings                   = getRefEntity(root.storeSettings, olddb);
    const products                        = getRefEntity(root.products, olddb);
    const ipns                            = getRefEntity(root.ipns, olddb);
    const customers                       = getRefEntity(root.customers, olddb);
    const credentials                     = getRefEntity(root.credentials, olddb);
    const coupons                         = getRefEntity(root.coupons, olddb);
    const contentlinks                    = getRefEntity(root.contentlinks, olddb);

    // get essential app entities from extroot
    // -> orders, invoices, transactions, vendorCommissionSummaries, contributorCommissionStatements
    const orders                          = getRefEntity(extroot.orders, olddb);
    const invoices                        = getRefEntity(extroot.invoices, olddb);
    const transactions                    = getRefEntity(extroot.transactions, olddb);
    const vendorCommissionSummaries       = getRefEntity(extroot.vendorCommissionSummaries, olddb);
    const contributorCommissionStatements = getRefEntity(extroot.contributorCommissionStatements, olddb);

    debugger;
}
