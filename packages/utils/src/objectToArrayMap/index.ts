interface Obj {
  [k: number]: any,
}

function objectItterance<obj extends Readonly<Obj>>(payload: obj) {
  let tmp = []

  const keys = Object.keys(payload)
  const values = Object.values(payload)
  const sourceLength = keys.length

  for (let i = 0; i < sourceLength; i++) {
    let obj = {
      key: "",
      value: null
    }
    obj.key = keys[i]
    obj.value = values[i]
    tmp[i] = obj
  }

  return tmp
}

export default function objectToArrayMap(payload: Obj, ...restPayload: any) {
  let tmp = []

  tmp = objectItterance(payload)

  if (typeof (restPayload) !== "undefined") {
    restPayload.forEach(item => {
      const arr = objectItterance(item)
      tmp = [...tmp, ...arr]
    })
  }

  return tmp
}