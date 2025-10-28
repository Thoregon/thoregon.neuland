/**
 *
 * todo [OPEN]:
 *  - seems WRTC on node causes SIGSEGV, handle with:
 *    -> [node-segfault-handler](https://github.com/Shiranuit/node-segfault-handler) (BSD 3-Clause License: OK)
 *    -> [segfault-handler](https://github.com/ddopson/node-segfault-handler) (BSD 3-Clause License: OK)
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import LifecycleEmitter from "../../src/lifecycleemitter.mjs";
import process          from "process";

export default class NodeLifecycleEmitter extends LifecycleEmitter {

    //
    // browser implementation
    //

    setup() {
        if (this.prepared) return;
        this.prepared = true;
        // this is done by the universe
        // const signlals = ['beforeExit', 'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM'];   // 'exit'; not applicable: 'SIGSEGV' 'SIGTSTP', 'SIGSTOP', 'SIGKILL' -> needs script/container restart
        // signlals.forEach((signal) => process.on(signal, (code) => this.emitExit(code) ));
        // process.on('uncaughtException', (err) => {
        //     console.log('>> Uncaught Exception', err);
        //     // some exceptions may need other handling
        // })
    }

    //
    // trigger
    //

    triggerPrepare() {
        this.setup();
        super.triggerPrepare();
    }

}
