// [utest]

const { objectToArrayMap } = require('@corenode/utils/dist/objectToArray')

const testMap = objectToArrayMap({ bruh: "nose", otra: "cosa" })

console.log(testMap)

testMap.forEach((entry) => {
    console.log(entry)
})
