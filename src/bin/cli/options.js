module.exports = [
    {
        option: "clearBefore",
        alias: "cb",
        description: "Clear console before print",
        type: "boolean",
        exec: () => {
            console.clear()
        }
    },
]