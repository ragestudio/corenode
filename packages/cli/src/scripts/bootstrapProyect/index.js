import { existsSync, writeFileSync } from 'fs'
import path from 'path'
import { getGit, getProjectEnv, getVersion, getPackages } from '@@nodecore'
import process from 'process'

export default async (params) => {
  return new Promise(async (resolve, reject) => {
    {
      const version = getVersion()
      const devRuntime = getProjectEnv().devRuntime
      const pkgs = getPackages()

      let opt = {
        license: 'MIT',
        originGit: getGit(),
        headPackage: devRuntime.headPackage,
        force: false
      }
      if (params) {
        opt = { ...opt, ...params }
      }

      pkgs.forEach((packageName) => {
        const name = `${opt.headPackage ? `@${opt.headPackage}/` : ''}${packageName}`
        const pkgPath = path.resolve(process.cwd(), `./packages/${packageName}`)

        const readmePath = path.resolve(pkgPath, `./README.md`)
        const pkgJSONPath = path.resolve(pkgPath, `./package.json`)

        const pkgJSONExists = existsSync(pkgJSONPath)
        const readmeExist = existsSync(readmePath)

        if (opt.force || !pkgJSONExists) {
          const json = {
            name,
            version,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            publishConfig: {
              access: 'public',
            },
          }

          if (!pkgJSONExists) {
            json.version = version
            json.files = ['dist', 'load.module.js']
          }

          if (opt.originGit) {
            json.repository = {
              type: 'git',
              url: opt.originGit,
            }
          }

          if (opt.license) {
            json.license = opt.license
          }

          if (pkgJSONExists) {
            const pkg = require(pkgJSONPath);
            [
              'dependencies',
              'devDependencies',
              'peerDependencies',
              'bin',
              'files',
              'types',
              'sideEffects',
              'main',
              'module',
            ].forEach((key) => {
              if (pkg[key]) json[key] = pkg[key];
            })
          }
          writeFileSync(pkgJSONPath, `${JSON.stringify(json, null, 2)}\n`)
        }

        if (packageName !== opt.headPackage) {
          if (opt.force || !readmeExist) {
            writeFileSync(readmePath, `# ${name}\n`)
          }
        }
      })
      return resolve(pkgs)
    }
  })
}