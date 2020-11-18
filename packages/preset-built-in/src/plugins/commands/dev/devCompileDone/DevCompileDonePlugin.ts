import { webpack } from '@nodecorejs/types';
import { chalk, address } from '@nodecorejs/utils';

interface IOpts {
  port: number;
  hostname: string;
  https?: boolean;
  onCompileDone: (args: {
    isFirstCompile: boolean;
    stats: webpack.Stats;
  }) => void;
  onCompileFail: (args: { stats: webpack.Stats }) => void;
}

export default class DevCompileDonePlugin {
  opts: IOpts;

  constructor(opts: IOpts) {
    this.opts = opts;
  }

  apply(compiler: webpack.Compiler) {
    let isFirstCompile = true;
    compiler.hooks.done.tap('DevFirstCompileDone', (stats) => {
      if (stats.hasErrors()) {
        this.opts.onCompileFail?.({ stats });
        return;
      }

      if (isFirstCompile) {
        const lanIp = address.ip();
        const protocol = this.opts.https ? 'https' : 'http';
        const hostname = this.opts.hostname === '0.0.0.0' ? 'localhost' : this.opts.hostname;

        const localUrl = `${protocol}://${hostname}:${this.opts.port}`;
        const lanUrl = `${protocol}://${lanIp}:${this.opts.port}`;

        console.log(
          [
            `\n\nApp listening to:`,
            `\n\n\n- Local: ${chalk.cyan(localUrl)}`,
            lanUrl && `\n\n- Network: ${chalk.cyan(lanUrl)}`,
          ]
            .filter(Boolean)
            .join('\n'),
        );
      }

      this.opts.onCompileDone?.({ isFirstCompile, stats });

      if (isFirstCompile) {
        isFirstCompile = false;
        process.send?.({ type: 'DONE' });
      }
    });
  }
}
