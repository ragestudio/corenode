import { BundlerConfigType, } from '@nodecorejs/types';
export default function ({ config, type }) {
    let targets = config.targets || {};
    targets = Object.keys(targets)
        .filter((key) => {
        // filter false and 0 targets
        if (targets[key] === false)
            return false;
        if (type === BundlerConfigType.ssr)
            return key === 'node';
        else
            return key !== 'node';
    })
        .reduce((memo, key) => {
        memo[key] = targets[key];
        return memo;
    }, {});
    const browserslist = targets.browsers ||
        Object.keys(targets).map((key) => {
            return `${key} >= ${targets[key] === true ? '0' : targets[key]}`;
        });
    return {
        targets,
        browserslist,
    };
}
