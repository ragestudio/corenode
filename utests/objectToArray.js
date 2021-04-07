// [utest]

const { objectToArrayMap } = require('@nodecorejs/utils/dist/objectToArray')

const testMap = objectToArrayMap({ bruh: "nose", otra: "cosa" })

console.log(testMap)

testMap.forEach((entry) => {
    console.log(entry)
})
