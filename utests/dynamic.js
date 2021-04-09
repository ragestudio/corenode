const fs = require("fs")
const path = require("path") 
const rimraf = require("rimraf")

const args = process.argv.slice(3, process.argv.length)
const temporalDir = path.resolve(__dirname, '.tmp')

const randomStrings = ["marisco", "antorcha", "espejo", "pitulin", "legumbre"]

function generateStupidNumber(min, max) {
    return Math.random() * (max - min) + min
}

function generateStupidFilename(ext) {
    const pre = generateStupidNumber(0, randomStrings.length).toFixed(0)
    const post = generateStupidNumber(0, 100000).toFixed(0)
  
    return `${randomStrings[pre]}_${post}.${ext? ext : "stupid"}`
}
 
function createStupidFile(data) {
    const file = path.resolve(temporalDir, generateStupidFilename("js"))

    fs.writeFileSync(file, JSON.stringify(data))
    return file
}

try {
    if (!args[0]) {
        // create mock file
        if (!fs.existsSync(temporalDir)) {
            fs.mkdirSync(temporalDir)
        }
    }

    const fileWatch = args[0] || createStupidFile("u stupid?")

    if (fs.existsSync(fileWatch)) {
        console.log(`\t👀  WATCHING >> ${fileWatch}`)
        fs.watch(fileWatch, (eventType, filename) => {
            if (eventType === "change") {
                console.log(eventType)
            }
        })   
    }
     
} catch (error) {
    // u idiot...  STUPIhd
    console.error(error)
}

process.on("exit", () => {
    if (!args[0]) {
        const dirs = fs.readdirSync(temporalDir)

        if (dirs) {
            if (dirs.length > 5) {
                console.log("Cleaning temporal files...")
                rimraf.sync(temporalDir)
            }    
        }
    }
})