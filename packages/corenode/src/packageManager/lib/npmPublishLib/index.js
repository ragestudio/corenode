const path = require('path')
const npmLibPath = path.dirname(require.resolve("npm"))

const npm = require('npm')
const util = require('util')
const semver = require('semver')
const pack = require('libnpmpack')
const libpub = require('libnpmpublish').publish
const runScript = require('@npmcli/run-script')
const pacote = require('pacote')
const npa = require('npm-package-arg')
const npmFetch = require('npm-registry-fetch')

const otplease = require(path.join(npmLibPath, "utils/otplease.js"))
const { getContents } = require(path.join(npmLibPath, "utils/tar.js"))
const flatten = require(path.join(npmLibPath, "utils/config/flatten.js"))

const readJson = util.promisify(require('read-package-json'))

function getManifest(spec, opts) {
    if (spec.type === 'directory')
        return readJson(`${spec.fetchSpec}/package.json`)
    return pacote.manifest(spec, { ...opts, fullMetadata: true })
}

async function npmPublish(args = {}) {
    await npm.config.load()

    const dryRun = args.dryRun ?? npm.config.get('dry-run')
    const defaultTag = npm.config.get('tag')

    if (semver.validRange(defaultTag))
        throw new Error('Tag name must not be a valid SemVer range: ' + defaultTag.trim())

    const opts = { ...npm.flatOptions }

    const spec = npa(args.cwd ?? process.cwd())
    let manifest = await getManifest(spec, opts)

    if (manifest.publishConfig)
        flatten(manifest.publishConfig, opts)

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