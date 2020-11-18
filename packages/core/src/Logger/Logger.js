import marked from 'marked';
import TerminalRenderer from 'marked-terminal';
import { chalk } from '@nodecorejs/utils';
import UmiError, { ERROR_CODE_MAP } from './UmiError';
import Common from './Common';
marked.setOptions({
    renderer: new TerminalRenderer(),
});
export default class Logger extends Common {
    constructor() {
        super(...arguments);
        this.LOG = chalk.black.bgBlue('LOG');
        this.INFO = chalk.black.bgBlue('INFO');
        this.WARN = chalk.black.bgHex('#faad14')('WARN');
        this.ERROR = chalk.black.bgRed('ERROR');
        this.PROFILE = chalk.black.bgCyan('PROFILE');
    }
    isUmiError(error) {
        return !!(error instanceof UmiError);
    }
    /**
     *
     * @param e only print UmiError
     * @param opts
     */
    printUmiError(e, opts = {}) {
        const { detailsOnly } = opts;
        const { code } = e;
        if (!code)
            return;
        const { message, details } = ERROR_CODE_MAP[code];
        console.error(`\n${chalk.bgRed.black('ERROR CODE')} ${chalk.red(code)}`);
        if (!detailsOnly) {
            console.error(`\n${chalk.bgRed.black('ERROR')} ${chalk.red(e.message || message)}`);
        }
        const osLocale = require('os-locale');
        const lang = osLocale.sync();
        if (lang === 'zh-CN') {
            console.error(`\n${chalk.bgMagenta.black(' DETAILS ')}\n\n${marked(details['zh-CN'])}`);
        }
        else {
            console.error(`\n${chalk.bgMagenta.black(' DETAILS ')}\n\n${marked(details.en)}`);
        }
        if (!detailsOnly && e.stack) {
            console.error(`${chalk.bgRed.black(' STACK ')}\n\n${e.stack
                .split('\n')
                .slice(1)
                .join('\n')}`);
        }
    }
    log(...args) {
        // TODO: node env production
        console.log(this.LOG, ...args);
    }
    /**
     * The {@link logger.info} function is an alias for {@link logger.log()}.
     * @param args
     */
    info(...args) {
        console.log(this.INFO, ...args);
    }
    error(...args) {
        if (this.isUmiError(args?.[0])) {
            // @ts-ignore
            this.printUmiError(...args);
        }
        else {
            console.error(this.ERROR, ...args);
        }
    }
    warn(...args) {
        console.warn(this.WARN, ...args);
    }
    profile(id, message) {
        const time = Date.now();
        const namespace = `${this.namespace}:${id}`;
        // for test
        let msg;
        if (this.profilers[id]) {
            const timeEnd = this.profilers[id];
            delete this.profilers[id];
            process.stderr.write(this.PROFILE + ' ');
            msg = `${this.PROFILE} ${chalk.cyan(`└ ${namespace}`)} Completed in ${this.formatTiming(time - timeEnd)}`;
            console.log(msg);
        }
        else {
            msg = `${this.PROFILE} ${chalk.cyan(`┌ ${namespace}`)} ${message || ''}`;
            console.log(msg);
        }
        this.profilers[id] = time;
        return msg;
    }
}
