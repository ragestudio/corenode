module.exports = [
    {
        option: "clearBefore",
        description: "Clear console before print",
        alias: ["cb"],
        type: "boolean",
        exec: () => {
            console.clear()
        }
    },
]