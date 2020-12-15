
import path from 'path'
// @ts-ignore
import stackTrace from 'stack-trace'
import chalk from 'chalk'
import { objectToArrayMap } from './objectToArray'

interface Obj {
    data: any,
    params: any,
    stackTraceParams: any
}

interface optStack {
    activeColor: boolean,
    line: boolean,
    method: boolean,
    file: boolean,
    time: boolean,
}

interface opt {
    secondColor: any,
    color: any,
    type: string
}

export default <obj extends Readonly<Obj>>(data: obj["data"], params?: obj["params"], stackTraceParams?: obj["stackTraceParams"]) => {
    let opt = <opt>{
        secondColor: [],
        color: [],
        type: "log"
    }
    opt.color[0] = "blue" // index 0 > for stack color

    let optStackTrace = <optStack>{
        line: false,
        method: true,
        file: false,
        time: true
    }

    try {
        const frame = stackTrace.get()[1]

        const stackTraceData = {
            time: new Date().toLocaleTimeString(),
            line: `(:${frame.getLineNumber()})`,
            file: path.basename(frame.getFileName()),
            method: `[${frame.getFunctionName()}]`
        }

        if (typeof (params) !== "undefined" || params != null) {
            // @ts-ignore
            objectToArrayMap(params).forEach((e: any) => {
                if (typeof (e.value) !== "undefined") {
                    // @ts-ignore
                    opt[e.key] = e.value
                }
            })
        }
 
        if (typeof (stackTraceParams) !== "undefined" || stackTraceParams != null) {
            // @ts-ignore
            objectToArrayMap(stackTraceParams).forEach((e: any) => {
                if (typeof (e.value) !== "undefined") {
                    // @ts-ignore
                    optStackTrace[e.key] = e.value
                }
            })
        }

        const getColor = (data: any, index: number) => {
            let thisColor = opt.color[index]
            let thisBackground = opt.secondColor[index]

            if (thisBackground) {
                // @ts-ignore
                return chalk[thisColor][thisBackground](data)
            }

            if (thisColor) {
                // @ts-ignore
                return chalk[thisColor](data)
            }

            return data
        }

        const stackTraceKeys = Object.keys(optStackTrace)
        const stackTraceLength = stackTraceKeys.length
        let modifyCount = 0
        let tmp

        for (let i = 0; i < stackTraceLength; i++) {
            const key = stackTraceKeys[i]
            // @ts-ignore
            const stackTraceDataKey = `${stackTraceData[key]}`
            const divisor = getColor((i == (stackTraceLength - 1) ? " | " : " > "), 0)

            // console.log(`[${key}] is the ${i == stackTraceLength? "last opt" : `n[${i}]` }`)
            // console.log(i, "/", stackTraceLength -1)

            // @ts-ignore
            if (typeof (stackTraceData[key]) !== "undefined" && optStackTrace[key]) {
                if (Array.isArray(data)) {
                    if (modifyCount == 0) {
                        tmp = (getColor(stackTraceDataKey, 0) + divisor)
                    } else {
                        tmp = (getColor(stackTraceDataKey, 0) + divisor + tmp)
                    }
                    if (i == (stackTraceLength - 1)) {
                        let mix: any[] = []
                        data.forEach((element: any) => {
                            if (opt.color[1] || opt.secondColor[1]) {
                                if (typeof (element) == "string") {
                                    return mix.push(getColor(element, 1))
                                }
                            }
                            mix.push(element)
                        })
                        mix.unshift(tmp)
                        data = mix
                    }
                } else {
                    // @ts-ignore
                    data = (getColor(stackTraceDataKey, 0) + divisor + getColor(data, 1))
                }
                modifyCount++
            }
        }

        if (Array.isArray(data)) {
            // @ts-ignore
            return console[opt.type](...data)
        }
        // @ts-ignore
        return console[opt.type](data)
    } catch (error) {
        return false
    }
}
