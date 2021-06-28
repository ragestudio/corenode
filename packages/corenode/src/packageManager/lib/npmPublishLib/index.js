const path = require('path')
const npmLibPath = path.dirname(require.resolve("npm"))

const util = require('util')
const semver = require('semver')
const pack = require('libnpmpack')
const libpub = require('libnpmpublish').publish
const runScript = require('@npmcli/run-script')
const pacote = require('pacote')
const npa = require('npm-package-arg')
const npmFetch = require('npm-registry-fetch')
const Config = require('@npmcli/config')

const otplease = require(path.join(npmLibPath, "utils/otplease.js"))
const { getContents } = require(path.join(npmLibPath, "utils/tar.js"))
const { flatten, definitions, shorthands } = require(path.join(npmLibPath, "utils/config"))

const readJson = util.promisify(require('read-package-json'))
class PublishController {
    constructor(params) {
        this.params = { ...params }

        this.loaded = false
        this.config = new Config({
            npmPath: path.dirname(__dirname),
            definitions,
            flatten,
            shorthands,
        })
    }

    async load() {
        await this.config.load()
        this.loaded = true
    }

    publish = async (args = {}) => {
        if (!this.loaded) {
            await this.load()
        }

        const dryRun = args.dryRun ?? false
        const defaultTag = this.config.get('tag')

        if (semver.validRange(defaultTag))
            throw new Error('Tag name must not be a valid SemVer range: ' + defaultTag.trim())

        const spec = npa(args.cwd ?? process.cwd())
        let manifest = await this.getManifest(spec, args)

        if (manifest.publishConfig)
            flatten(manifest.publishConfig, args)

        const tarballData = await pack(spec, args)
        const pkgContents = await getContents(manifest, tarballData)

        manifest = await this.getManifest(spec, args)

        if (manifest.publishConfig)
            flatten(manifest.publishConfig, args)

        if (!dryRun) {
            const resolved = npa.resolve(manifest.name, manifest.version)
            const registry = npmFetch.pickRegistry(resolved, args)
            const creds = this.config.getCredentialsByURI(registry)

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
                banner: !args.silent,
            })

            await runScript({
                event: 'postpublish',
                path: spec.fetchSpec,
                stdio: 'inherit',
                pkg: manifest,
                banner: !args.silent,
            })
        }

        return pkgContents
    }

    async getManifest(spec, opts) {
        if (spec.type === 'directory')
            return readJson(`${spec.fetchSpec}/package.json`)
        return pacote.manifest(spec, { ...opts, fullMetadata: true })
    }
}

module.exports = { PublishController }