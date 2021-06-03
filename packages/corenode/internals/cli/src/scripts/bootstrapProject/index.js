import fs from 'fs'
import path from 'path'

import { getPackages, isProjectMode } from 'corenode'

export default async (params) => {
  return new Promise(async (resolve, reject) => {
    {
      const hasPackages = isProjectMode()
      const projectVersion = global.project.version
      const devEnv = global._env.development ?? {}
      const allPackages = getPackages()

      let options = {
        force: false,
        ...params
      }

      let fields = {
        license: 'MIT',
        files: ['dist', 'load.addon.js']
      }

      if (typeof devEnv.defaultLicense !== "undefined") {
        fields.license = devEnv.defaultLicense
      }

      if (typeof devEnv.originGit !== "undefined") {
        fields.originGit = devEnv.originGit
      }

      if (typeof devEnv.headPackage !== "undefined") {
        fields.headPackage = devEnv.headPackage
      }

      if (typeof devEnv.publishAccess !== "undefined") {
        fields.publishConfig = {
          access: devEnv.publishAccess
        }
      }

      if (typeof devEnv.packagesFiles !== "undefined") {
        fields.files = devEnv.packagesFiles
      }

      allPackages.forEach((packageName) => {
        const name = `${fields.headPackage ? `@${fields.headPackage}/` : ''}${packageName}`
        const pkgPath = hasPackages ? path.resolve(process.cwd(), `./packages/${packageName}`) : process.cwd()

        const readmePath = path.resolve(pkgPath, `./README.md`)
        const pkgJSONPath = path.resolve(pkgPath, `./package.json`)

        const pkgJSONExists = fs.existsSync(pkgJSONPath)
        const readmeExist = fs.existsSync(readmePath)

        if (options.force || !readmeExist) {
          fs.writeFileSync(readmePath, `# ${name}\n`)
        }

        if (options.force || !pkgJSONExists) {
          let content = {
            name,
            version: projectVersion,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            publishConfig: {
              access: 'public',
            },
            ...fields
          }

          if (fields.originGit) {
            content.repository = {
              type: 'git',
              url: fields.originGit,
            }
          }

          if (pkgJSONExists) {
            const pkg = require(pkgJSONPath)
            const keys = [
              'dependencies',
              'devDependencies',
              'peerDependencies',
              'bin',
              'files',
              'types',
              'sideEffects',
              'main',
              'module',
            ]

            keys.forEach((key) => {
              if (pkg[key]) {
                content[key] = pkg[key]
              }
            })
          }

          fs.writeFileSync(pkgJSONPath, `${JSON.stringify(content, null, 2)}\n`)
        }

      })

      return resolve()
    }
  })
}