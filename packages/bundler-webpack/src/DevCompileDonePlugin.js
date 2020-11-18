export default class DevCompileDonePlugin {
    constructor(opts) {
        this.opts = opts;
    }
    apply(compiler) {
        let isFirstCompile = true;
        compiler.hooks.done.tap('DevFirstCompileDone', (stats) => {
            if (stats.hasErrors()) {
                // make sound
                if (process.env.SYSTEM_BELL !== 'none') {
                    process.stdout.write('\x07');
                }
                return;
            }
            console.log(`App running at: http://localhost:${this.opts.port}`);
            if (isFirstCompile) {
                process.send?.({ type: 'DONE' });
                isFirstCompile = false;
            }
        });
    }
}
