class NError extends Error {
    constructor(...context) {
        super(...context)
        console.log("CORENODE ERROR")
    }
}

Error = NError

try {
    throw new Error("BRUh")
} catch (error) {
    console.log(`Catched new error >`, error)
}