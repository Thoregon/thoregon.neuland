/**
 * defines all errors used in pubsub
 *
 * @author: blukassen
 */
import { EError }       from '/evolux.supervise';
import { className }    from "/evolux.util";

export const ErrNotImplemented            = (msg)             => new EError(`Not implemented: ${msg}`,                        "NEULAND:00001");
