/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import LifecycleEmitter from "./lifecycleemitter.mjs";

export default class BrowserLifecycleEmitter extends LifecycleEmitter {

    //
    // browser implementation
    //

    setup() {
        if (this.prepared) return;
        this.prepared = true;
        document.addEventListener('beforeunload', () => this.emitExit());
        document.addEventListener('visibilitychange', (event) => {
            switch (document.visibilityState) {
                case 'hidden':
                    this.emitPause();
                    break;
                case 'visible':
                    this.emitResume();
                    break;
            }
        });
    }
    //
    // trigger
    //

    triggerPrepare() {
        this.setup();
        super.triggerPrepare();
    }

}
