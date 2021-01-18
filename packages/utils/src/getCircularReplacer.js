export default function getCircularReplacer() {
    const seen = new WeakSet()
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return { __cycle_flag: true }
            }
            seen.add(value)
        }
        return value
    }
}