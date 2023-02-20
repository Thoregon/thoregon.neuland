/**
 *
 * todo [REFACTOR]
 *  - use statemachine
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

const debuglog = (...args) => console.log("LifecycleEmitter", Date.now(), ":", ...args);

export default class LifecycleEmitter {

    constructor() {
        this.eventlisteners = {};
        this.prepared       = false;
        this.started        = false;
        this.paused         = false;
        this.exitCode       = undefined;
    }

    //
    // event listeners
    //

    emitEvent(eventname, details, { once = false } = {}) {
        let listeners = this.eventlisteners[eventname];
        if (!listeners) return;
        if (once) delete this.eventlisteners[eventname];
        listeners.forEach((fn) => {
            try { fn({ event: eventname, details }) } catch (e) { debuglog("emit event", e) }
        })
    }

    addEventListener(eventname, fn) {
        let listeners = this.eventlisteners[eventname];
        if (!listeners) listeners = this.eventlisteners[eventname] = [];
        listeners.push(fn);
        this.replay(eventname, fn);
        return this;
    }

    removeEventListener(eventname, fn) {
        let listeners = this.eventlisteners[eventname];
        if (!listeners) return;
        this.eventlisteners[eventname] = listeners.filter((listener) => listener != fn);
        return this;
    }

    //
    // events must be triggered by the thoregon system
    //

    triggerPrepare() {
        this.emitPrepare();
    }

    triggerStart() {
        this.emitStart();
    }

    triggerExit(code) {
        this.emitExit(code);
    }

    //
    // replay current state
    //

    // replay the current state if a listener is added after state change (todo: use statemachine)
    replay(eventname, fn) {
        // setTimeout(() => {
            switch (eventname) {
                case 'prepare':
                    if (this.exitCode) break;
                    if (!this.prepared) break;
                    try { fn({ event: eventname, details: {} }) } catch (e) { debuglog("emit event", e) }
                    delete this.eventlisteners[eventname];
                    break;
                case 'start':
                    if (this.exitCode) break;
                    if (!this.started) break;
                    try { fn({ event: eventname, details: {} }) } catch (e) { debuglog("emit event", e) }
                    delete this.eventlisteners[eventname];
                    break;
                case 'pause':
                    if (this.exitCode) break;
                    if (!this.paused) break;
                    try { fn({ event: eventname, details: {} }) } catch (e) { debuglog("emit event", e) }
                    break;
                case 'exit':
                    if (!this.exitCode) break;
                    try { fn({ event: eventname, details: { code: this.exitCode } }) } catch (e) { debuglog("emit event", e) }
                    delete this.eventlisteners[eventname];
                    break;
            }
       // }, 1);
    }

    //
    // lifecycle event source, must be implemented by subclasses
    //

    emitPrepare()  {
        this.prepared = true;
        this.emitEvent('prepare', {},{ once: true });
    }
    emitStart()    {
        this.started = true;
        this.emitEvent('start', {}, { once: true });
    }
    emitPause()    {
        this.paused = true;
        this.emitEvent('pause', {}, {});
    }
    emitResume()   {
        this.paused = false;
        this.emitEvent('resume', {}, {})
    }
    emitExit(code) {
        this.exitCode = code;
        this.emitEvent('exit', { code }, { once: true })
    }

}
