import * as path from 'path';
import anymatch from 'anymatch';
export default ({ ignored }) => {
    expect(anymatch(ignored)(path.join(__dirname, 'bar', 'index.js'))).toBeTruthy();
    expect(anymatch(ignored)(path.join(__dirname, 'bar'))).toBeFalsy();
    // issue: https://github.com/nodecorejs/umi/issues/5416
    expect(anymatch(ignored)(path.join(__dirname, 'distributor', 'index.tsx'))).toBeFalsy();
    expect(anymatch(ignored)(path.join(__dirname, 'distributor'))).toBeFalsy();
    expect(anymatch(ignored)(path.join(__dirname, 'node_modules'))).toBeTruthy();
};
