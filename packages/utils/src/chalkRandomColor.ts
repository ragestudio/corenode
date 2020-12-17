import chalk from 'chalk';

const colors = [
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'gray',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
];

let index = 0;
const cache = {};

export default function (string:any) {
  if (!cache[string]) {
    const color = colors[index];
    let str = chalk[color].bold(string);
    cache[string] = str;
    if (index === colors.length - 1) {
      index = 0;
    } else {
      index += 1;
    }
  }
  return cache[string].replace(',', '');
}