export default function decycle(obj, stack = []) {
    if (!obj || typeof obj !== 'object')
        return obj
    if (stack.includes(obj)) {
        return { __cycle_flag: true }
    }

    let s = stack.concat([obj])

    return Array.isArray(obj) ? obj.map(x => decycle(x, s)) : Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, decycle(v, s)]))
}