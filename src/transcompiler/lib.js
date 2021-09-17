/* eslint-disable no-console */
import globCb from "glob"
import { exists, mkdir, readdir, readFile, stat, writeFile } from "mz/fs"
import { dirname, join, relative } from "path"
import { promisify } from "util"

import { transform } from "./index"

const glob = promisify(globCb)

export async function build(params) {
    const options = {
        outDirPath: params.outputDir,
        srcDirPath: params.inputDir,
        project: params.project,
        outExtension: params.outExtension,
        excludeDirs: params.excludeDirs ? params.excludeDirs.split(",") : [],
        quiet: params.quiet,
        sucraseOptions: {
            transforms: params.transforms ? params.transforms.split(",") : [],
            enableLegacyTypeScriptModuleInterop: params.enableLegacyTypescriptModuleInterop,
            enableLegacyBabel5ModuleInterop: params.enableLegacyBabel5ModuleInterop,
            jsxPragma: params.jsxPragma || "React.createElement",
            jsxFragmentPragma: params.jsxFragmentPragma || "React.Fragment",
            production: params.production,
        },
    }

    return buildDirectory(options).catch((e) => {
        process.exitCode = 1
        console.error(e)
    })
}

export async function updateOptionsFromProject(options) {
    /**
     * Read the project information and assign the following.
     *  - outDirPath
     *  - transform: imports
     *  - transform: typescript
     *  - enableLegacyTypescriptModuleInterop: true/false.
     */

    const tsConfigPath = join(options.project, "tsconfig.json")

    let str = null

    try {
        str = await readFile(tsConfigPath, "utf8")
    } catch (err) {
        console.error("Could not find project tsconfig.json")
        console.error(`  --project=${options.project}`)
        console.error(err)
        process.exit(1)
    }

    const json = JSON.parse(str)
    const sucraseOpts = options.sucraseOptions

    if (!sucraseOpts.transforms.includes("typescript")) {
        sucraseOpts.transforms.push("typescript")
    }

    const compilerOpts = json.compilerOptions

    if (compilerOpts.outDir) {
        options.outDirPath = join(process.cwd(), options.project, compilerOpts.outDir)
    }
    if (compilerOpts.esModuleInterop !== true) {
        sucraseOpts.enableLegacyTypeScriptModuleInterop = true;
    }
    if (compilerOpts.module === "commonjs") {
        if (!sucraseOpts.transforms.includes("imports")) {
            sucraseOpts.transforms.push("imports")
        }
    }
}

export async function buildDirectory(options) {
    let files = undefined

    if (options.outDirPath && options.srcDirPath) {
        files = await findFiles(options)
    } else if (options.project) {
        await updateOptionsFromProject(options)
        files = await runGlob(options)
    } else {
        console.error("Project or Source directory required.")
        process.exit(1)
    }

    for (const file of files) {
        await buildFile(file.srcPath, file.outPath, options)
    }
}

export async function buildFile(srcPath, outPath, options) {
    if (!options.quiet) {
        console.log(`${srcPath} -> ${outPath}`)
    }

    const code = (await readFile(srcPath)).toString()
    const transformedCode = transform(code, { ...options.sucraseOptions, filePath: srcPath }).code

    await writeFile(outPath, transformedCode)
}


export async function findFiles(options) {
    const outDirPath = options.outDirPath
    const srcDirPath = options.srcDirPath

    const extensions = options.sucraseOptions.transforms.includes("typescript") ? [".ts", ".tsx"] : [".js", ".jsx"]

    if (!(await exists(outDirPath))) {
        await mkdir(outDirPath)
    }

    const outArr = []

    for (const child of await readdir(srcDirPath)) {
        if (["node_modules", ".git"].includes(child) || options.excludeDirs.includes(child)) {
            continue
        }

        const srcChildPath = join(srcDirPath, child)
        const outChildPath = join(outDirPath, child)

        if ((await stat(srcChildPath)).isDirectory()) {
            const innerOptions = { ...options }

            innerOptions.srcDirPath = srcChildPath
            innerOptions.outDirPath = outChildPath

            const innerFiles = await findFiles(innerOptions)
            outArr.push(...innerFiles)
        } else if (extensions.some((ext) => srcChildPath.endsWith(ext))) {
            const outPath = outChildPath.replace(/\.\w+$/, `.${options.outExtension}`)
            outArr.push({
                srcPath: srcChildPath,
                outPath,
            })
        }
    }

    return outArr
}

export async function runGlob(options) {
    const tsConfigPath = join(options.project, "tsconfig.json")

    let str

    try {
        str = await readFile(tsConfigPath, "utf8")
    } catch (err) {
        console.error("Could not find project tsconfig.json")
        console.error(`  --project=${options.project}`)
        console.error(err)
        process.exit(1)
    }

    const json = JSON.parse(str);

    const foundFiles = []

    const files = json.files
    const include = json.include

    const absProject = join(process.cwd(), options.project)
    const outDirs = []

    if (!(await exists(options.outDirPath))) {
        await mkdir(options.outDirPath)
    }

    if (files) {
        for (const file of files) {
            if (file.endsWith(".d.ts")) {
                continue
            }
            if (!file.endsWith(".ts") && !file.endsWith(".js")) {
                continue
            }

            const srcFile = join(absProject, file)
            const outFile = join(options.outDirPath, file)
            const outPath = outFile.replace(/\.\w+$/, `.${options.outExtension}`)

            const outDir = dirname(outPath)
            if (!outDirs.includes(outDir)) {
                outDirs.push(outDir)
            }

            foundFiles.push({
                srcPath: srcFile,
                outPath,
            })
        }
    }

    if (include) {
        for (const pattern of include) {
            const globFiles = await glob(join(absProject, pattern))
            for (const file of globFiles) {
                if (!file.endsWith(".ts") && !file.endsWith(".js")) {
                    continue
                }
                if (file.endsWith(".d.ts")) {
                    continue
                }

                const relativeFile = relative(absProject, file)
                const outFile = join(options.outDirPath, relativeFile)
                const outPath = outFile.replace(/\.\w+$/, `.${options.outExtension}`)

                const outDir = dirname(outPath)
                if (!outDirs.includes(outDir)) {
                    outDirs.push(outDir);
                }

                foundFiles.push({
                    srcPath: file,
                    outPath,
                })
            }
        }
    }

    for (const outDirPath of outDirs) {
        if (!(await exists(outDirPath))) {
            await mkdir(outDirPath)
        }
    }

    // TODO: read exclude

    return foundFiles
}

export default build