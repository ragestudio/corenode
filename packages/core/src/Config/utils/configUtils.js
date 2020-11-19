import { lodash } from '@nodecorejs/utils';
// @ts-ignore
import set from 'set-value';
export function updateUserConfigWithKey({ key, value, userConfig, }) {
    set(userConfig, key, value);
}
export function getUserConfigWithKey({ key, userConfig, }) {
    return lodash.get(userConfig, key);
}
