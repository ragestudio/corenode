//* Copyright (c) 2015, npm, Inc

const builtins = require('../../../libs/builtins')

const scopedPackagePattern = new RegExp('^(?:@([^/]+?)[/])?([^/]+?)$')
const blacklist = [
    'node_modules',
    'favicon.ico'
]

const validate = module.exports = function (name) {
    let warnings = []
    let errors = []

    if (name === null) {
        errors.push('name cannot be null')
        return done(warnings, errors)
    }

    if (name === undefined) {
        errors.push('name cannot be undefined')
        return done(warnings, errors)
    }

    if (typeof name !== 'string') {
        errors.push('name must be a string')
        return done(warnings, errors)
    }

    if (!name.length) {
        errors.push('name length must be greater than zero')
    }

    if (name.match(/^\./)) {
        errors.push('name cannot start with a period')
    }

    if (name.match(/^_/)) {
        errors.push('name cannot start with an underscore')
    }

    if (name.trim() !== name) {
        errors.push('name cannot contain leading or trailing spaces')
    }

    // No funny business
    blacklist.forEach(function (blacklistedName) {
        if (name.toLowerCase() === blacklistedName) {
            errors.push(blacklistedName + ' is a blacklisted name')
        }
    })

    // Generate warnings for stuff that used to be allowed

    // core module names like http, events, util, etc
    builtins.forEach(function (builtin) {
        if (name.toLowerCase() === builtin) {
            warnings.push(builtin + ' is a core module name')
        }
    })

    // really-long-package-names-------------------------------such--length-----many---wow
    // the thisisareallyreallylongpackagenameitshouldpublishdowenowhavealimittothelengthofpackagenames-poch.
    if (name.length > 214) {
        warnings.push('name can no longer contain more than 214 characters')
    }

    // mIxeD CaSe nAMEs
    if (name.toLowerCase() !== name) {
        warnings.push('name can no longer contain capital letters')
    }

    if (/[~'!()*]/.test(name.split('/').slice(-1)[0])) {
        warnings.push('name can no longer contain special characters ("~\'!()*")')
    }

    if (encodeURIComponent(name) !== name) {
        // Maybe it's a scoped package name, like @user/package
        const nameMatch = name.match(scopedPackagePattern)
        if (nameMatch) {
            const user = nameMatch[1]
            const pkg = nameMatch[2]
            if (encodeURIComponent(user) === user && encodeURIComponent(pkg) === pkg) {
                return done(warnings, errors)
            }
        }

        errors.push('name can only contain URL-friendly characters')
    }

    return done(warnings, errors)
}

validate.scopedPackagePattern = scopedPackagePattern

const done = function (warnings, errors) {
    const result = {
        validForNewPackages: errors.length === 0 && warnings.length === 0,
        validForOldPackages: errors.length === 0,
        warnings: warnings,
        errors: errors
    }
    if (!result.warnings.length) delete result.warnings
    if (!result.errors.length) delete result.errors
    return result
}