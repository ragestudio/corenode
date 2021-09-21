/* eslint-disable no-console */
import fastGlob from "fast-glob"
import { exists, mkdir, readdir, readFile, stat, writeFile } from "mz/fs"
import { dirname, basename, join, relative, resolve, extname } from "path"
import fs from "fs"

import { transform } from "./index"

const supportedExtensions = [".js", ".jsx", ".ts", ".tsx"]

export async function build(params) {
    const options = {
        outDirPath: params.outputDir,
        srcDirPath: params.inputDir,
        project: params.project,
        outExtension: params.outExtension,
        ignoreSources: params.ignoreSources ?? [],
        excludeSources: params.excludeSources ?? [],
        quiet: params.quiet,
        sucraseOptions: {
            transforms: typeof params.transforms === "string" ? params.transforms.split(",") : params.transforms,
            enableLegacyTypeScriptModuleInterop: params.enableLegacyTypescriptModuleInterop,
            enableLegacyBabel5ModuleInterop: params.enableLegacyBabel5ModuleInterop,
            jsxPragma: params.jsxPragma || "React.createElement",
            jsxFragmentPragma: params.jsxFragmentPragma || "React.Fragment",
            production: params.production,
        },
    }

    if (Array.isArray(options.ignoreSources)) {
        options.ignoreSources = options.ignoreSources.map(s => resolve(options.srcDirPath, s))
    }

    return buildDirectory(options).catch((e) => {
        process.exitCode = 1
        console.error(e)
    })
}

export async function buildDirectory(options) {
    let files = undefined

    if (options.outDirPath && options.srcDirPath) {
        const patterns = [`${options.srcDirPath}/**/**`]

        if (Array.isArray(options.excludeSources)) {
            options.excludeSources.forEach(s => patterns.push(`!${resolve( options.srcDirPath, "..", s)}`))
        }

        files = await fastGlob(patterns, { absolute: true })
        files = files.map((file) => {
            return {
                srcPath: file,
                outPath: join(options.outDirPath, relative(options.srcDirPath, file)),
            }
        })
    }

    for (const file of files) {
        await buildFile(file.srcPath, file.outPath, options)
    }
}

export async function buildFile(srcPath, outPath, options) {
    if (!options.quiet) {
        console.log(`${srcPath} -> ${outPath}`)
    }
    
    outPath = outPath.replace(/\.\w+$/, `.${options.outExtension ?? "js"}`)
    const isSupported = supportedExtensions.includes(extname(srcPath))
    const outDirname = dirname(outPath)

    if (!exists(outDirname)) {
        fs.mkdirSync(outDirname, { recursive: true })
    }

    let code = (await readFile(srcPath)).toString()

    if (!options.ignoreSources.includes(srcPath) && isSupported) {
        code = transform(code, { ...options.sucraseOptions, filePath: srcPath }).code
    }

    await writeFile(outPath, code)
}

export default build