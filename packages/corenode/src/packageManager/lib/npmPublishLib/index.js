const npm = require('npm/lib/npm.js')
const util = require('util')
const semver = require('semver')
const pack = require('libnpmpack')
const libpub = require('libnpmpublish').publish
const runScript = require('@npmcli/run-script')
const pacote = require('pacote')
const npa = require('npm-package-arg')
const npmFetch = require('npm-registry-fetch')

const otplease = require('npm/lib/utils/otplease.js')
const { getContents } = require('npm/lib/utils/tar.js')
const flatten = require('npm/lib/utils/config/flatten.js')
const readJson = util.promisify(require('read-package-json'))

function getManifest(spec, opts) {
    if (spec.type === 'directory')
        return readJson(`${spec.fetchSpec}/package.json`)
    return pacote.manifest(spec, { ...opts, fullMetadata: true })
}

async function npmPublish(args) {
    if (args.length === 0)
        args = ['.']
    if (args.length !== 1)
        throw new Error('Invalid args')

    const unicode = npm.config.get('unicode')
    const dryRun = npm.config.get('dry-run')
    const json = npm.config.get('json')
    const defaultTag = npm.config.get('tag')

    if (semver.validRange(defaultTag))
        throw new Error('Tag name must not be a valid SemVer range: ' + defaultTag.trim())

    const opts = { ...npm.flatOptions }
    // you can publish name@version, ./foo.tgz, etc.
    // even though the default is the 'file:.' cwd.
    const spec = npa(args[0])
    let manifest = await getManifest(spec, opts)

    if (manifest.publishConfig)
        flatten(manifest.publishConfig, opts)

    // only run scripts for directory type publishes
    if (spec.type === 'directory') {
        await runScript({
            event: 'prepublishOnly',
            path: spec.fetchSpec,
            stdio: 'inherit',
            pkg: manifest,
            banner: !silent,
        })
    }

    const tarballData = await pack(spec, opts)
    const pkgContents = await getContents(manifest, tarballData)

    manifest = await getManifest(spec, opts)
    if (manifest.publishConfig)
        flatten(manifest.publishConfig, opts)

    if (!dryRun) {
        const resolved = npa.resolve(manifest.name, manifest.version)
        const registry = npmFetch.pickRegistry(resolved, opts)
        const creds = npm.config.getCredentialsByURI(registry)

        if (!creds.token && !creds.username) {
            throw Object.assign(new Error('This command requires you to be logged in.'), {
                code: 'ENEEDAUTH',
            })
        }

        await otplease(opts, opts => libpub(manifest, tarballData, opts))
    }

    if (spec.type === 'directory') {
        await runScript({
            event: 'publish',
            path: spec.fetchSpec,
            stdio: 'inherit',
            pkg: manifest,
            banner: !silent,
        })

        await runScript({
            event: 'postpublish',
            path: spec.fetchSpec,
            stdio: 'inherit',
            pkg: manifest,
            banner: !silent,
        })
    }

    return pkgContents
}

module.exports = npmPublish