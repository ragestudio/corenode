const fastGlob = require('fast-glob')
const path = require("path")
const fs = require('fs')
const { pLocate } = require("@corenode/utils")

const findUpStop = Symbol('findUpStop')
const typeMappings = {
    directory: 'isDirectory',
    file: 'isFile',
}

function checkType(type) {
    if (type in typeMappings) {
        return
    }

    throw new Error(`Invalid type specified: ${type}`)
}

const matchType = (type, stat) => type === undefined || stat[typeMappings[type]]()

function match(match = ["**"], options = { cwd: process.cwd() }) {
    return fastGlob(match, options)
}

function matchSync(match = ["**"], options = { cwd: process.cwd() }) {
    return fastGlob.sync(match, options)
}

async function pathExists(_path) {
    try {
        await fs.promises.access(_path)
        return true
    } catch {
        return false
    }

}

function pathExistsSync(_path) {
    try {
        fs.accessSync(_path)
        return true
    } catch {
        return false
    }
}

// MIT License
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
async function locatePath(
    paths,
    {
        cwd = process.cwd(),
        type = 'file',
        allowSymlinks = true,
        concurrency,
        preserveOrder,
    } = {},
) {
    checkType(type)

    const statFunction = allowSymlinks ? fs.promises.stat : fs.promises.lstat

    return pLocate(paths, async path_ => {
        try {
            const stat = await statFunction(path.resolve(cwd, path_))
            return matchType(type, stat)
        } catch {
            return false
        }
    }, { concurrency, preserveOrder })
}

// MIT License
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
function locatePathSync(
    paths,
    {
        cwd = process.cwd(),
        type = 'file',
        allowSymlinks = true,
    } = {},
) {
    checkType(type)

    const statFunction = allowSymlinks ? fs.statSync : fs.lstatSync

    for (const path_ of paths) {
        try {
            const stat = statFunction(path.resolve(cwd, path_))

            if (matchType(type, stat)) {
                return path_
            }
        } catch { }
    }
}

// MIT License
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
async function findUp(name, options = {}) {
    let directory = path.resolve(options.cwd || '')
    const { root } = path.parse(directory)
    const paths = [name].flat()

    const runMatcher = async locateOptions => {
        if (typeof name !== 'function') {
            return locatePath(paths, locateOptions)
        }

        const foundPath = await name(locateOptions.cwd)
        if (typeof foundPath === 'string') {
            return locatePath([foundPath], locateOptions)
        }

        return foundPath
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const foundPath = await runMatcher({ ...options, cwd: directory })

        if (foundPath === findUpStop) {
            return
        }

        if (foundPath) {
            return path.resolve(directory, foundPath)
        }

        if (directory === root) {
            return
        }

        directory = path.dirname(directory)
    }
}


// MIT License
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
function findUpSync(name, options = {}) {
    let directory = path.resolve(options.cwd || '')
    const { root } = path.parse(directory)
    const paths = [name].flat()

    const runMatcher = locateOptions => {
        if (typeof name !== 'function') {
            return locatePathSync(paths, locateOptions)
        }

        const foundPath = name(locateOptions.cwd)
        if (typeof foundPath === 'string') {
            return locatePathSync([foundPath], locateOptions)
        }

        return foundPath
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const foundPath = runMatcher({ ...options, cwd: directory })

        if (foundPath === findUpStop) {
            return
        }

        if (foundPath) {
            return path.resolve(directory, foundPath)
        }

        if (directory === root) {
            return
        }

        directory = path.dirname(directory)
    }
}

function listFiles(origin, maxDepth) {
    function read(dir, depth) {
        depth += 1

        if (typeof maxDepth !== "undefined") {
            if (depth >= maxDepth) {
                return []
            }
        }

        return fs.readdirSync(dir).reduce((list, file) => {
            const name = path.join(dir, file)
            const isDir = fs.lstatSync(name).isDirectory()

            return list.concat(isDir ? read(name, depth) : [name])
        }, [])
    }

    return read(origin, 0)
}

function listDirectories(origin, maxDepth) {
    origin = path.resolve(origin)

    function read(dir, depth) {
        depth += 1
        let dirs = []

        if (typeof maxDepth !== "undefined") {
            if (depth >= maxDepth) {
                return []
            }
        }

        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((innerDir) => {
                innerDir = path.resolve(dir, innerDir)

                if (fs.lstatSync(innerDir).isDirectory()) {
                    dirs.push(innerDir)

                    read(innerDir, depth).forEach((innerDir) => {
                        dirs.push(innerDir)
                    })
                }
            })
        }

        return dirs
    }

    return read(origin, 0)
}

/**
* Read all directories from root path
* @param {string} [dir = ""]
* @param {object} [params = undefined]
* @param {object} [params.cwd = process.cwd]
* @param {object} [params.dotFilter = true]
* @function readRootDirectorySync
*/
function readRootDirectorySync(dir, params) {
    let names = []
    const parentPath = path.resolve((params?.cwd ?? process.cwd()), dir ?? "")

    if (fs.existsSync(parentPath)) {
        let paths = fs.readdirSync(parentPath)

        if (params?.dotFilter ?? true) {
            paths = paths.filter((_path) => _path.charAt(0) !== '.')
        }
        paths.forEach((_path) => {
            if (params?.fullPath ?? false) {
                return names.push(path.resolve(parentPath, _path))
            }
            return names.push(_path)
        })
    }

    return names
}

module.exports = {
    match,
    matchSync,
    findUp,
    findUpSync,
    pathExists,
    pathExistsSync,
    locatePath,
    locatePathSync,
    checkType,
    matchType,
    typeMappings,
    listFiles,
    listDirectories,
    readRootDirectorySync,
}