const findUp = require("find-up")
const path = require("path")
const fs = require("fs")

const versionFile = findUp.sync(['.version'])
let version = fs.readFileSync(versionFile, 'utf8')
module.exports.version = version

let parsedVersion = {
    major: 0,
    minor: 0,
    patch: 0
}
module.exports.parsedVersion = parsedVersion

try {
    const args = process.argv.slice(2);
    const parsed = version.split('.')

    parsedVersion.major = parsed[0] ? Number(parsed[0]) : 0
    parsedVersion.minor = parsed[1] ? Number(parsed[1]) : 0
    parsedVersion.patch = parsed[2] ? Number(parsed[2]) : 0

    if (args[0]) {
        switch (args[0]) {
            case "update": {
                console.log(`⚙ Updating version (${version}) to (${args[1]})`)
                return updateVersion(args[1])
            }
            case "bump": {
                return bumpVersion(args[1])
            }
            default: {
                console.error("Invalid arguments!")
                break;
            }
        }
    }
} catch (error) {
    console.error("Fatal error! >", error)
    return false
}

function parsedVersionToString(version) {
    return `${version.major}.${version.minor}.${version.patch}`
}
module.exports.parsedVersionToString = parsedVersionToString

function updateVersion(to) {
    if (!to) {
        return false
    }
    let updated

    if (typeof (to) == "object") {
        updated = parsedVersionToString(to)
    } else {
        const parsed = to.split('.')
        parsedVersion.major = parsed[0] ? Number(parsed[0]) : 0
        parsedVersion.minor = parsed[1] ? Number(parsed[1]) : 0
        parsedVersion.patch = parsed[2] ? Number(parsed[2]) : 0

        updated = parsedVersionToString(parsedVersion)
    }

    console.log(`✅ Version updated to > ${updated}`)
    return fs.writeFileSync(versionFile, updated)
}
module.exports.updateVersion = updateVersion

function bumpVersion(params) {
    const bumps = {
        major: params.includes("major"),
        minor: params.includes("minor"),
        patch: params.includes("patch"),
    }

    if (bumps.major) {
        parsedVersion.major = parsedVersion.major + 1
        parsedVersion.minor = 0
        parsedVersion.path = 0
    }
    if (bumps.minor) {
        parsedVersion.minor = parsedVersion.minor + 1
        parsedVersion.path = 0
    }
    if (bumps.patch) {
        parsedVersion.patch = parsedVersion.patch + 1
    }

    function bumpTable(major, minor, patch) {
        this.major = major? parsedVersion.major : false;
        this.minor = minor? parsedVersion.minor : false;
        this.patch = patch? parsedVersion.patch : false;
    }
    console.table(new bumpTable(bumps.major, bumps.minor, bumps.patch));

    return updateVersion(parsedVersion)
}
module.exports.bumpVersion = bumpVersion