import { createDebug } from '@nodecorejs/utils';
class Common {
    constructor(namespace) {
        // TODO: get namespace filename accounding caller function
        if (!namespace) {
            throw new Error(`logger needs namespace`);
        }
        this.namespace = namespace;
        this.profilers = {};
        this.debug = createDebug(this.namespace);
    }
    formatTiming(timing) {
        return timing < 60 * 1000
            ? `${Math.round(timing / 10) / 100}s`
            : `${Math.round(timing / 600) / 100}m`;
    }
}
export default Common;
