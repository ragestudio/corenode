function overrideObjects(origin, to) {
    Object.keys(to).forEach((key) => {
        if (typeof origin[key] === "object" && typeof to[key] === "object") {
            overrideObjects(origin[key], to[key])
        } else {
            origin[key] = to[key]
        }
    })

    return origin
}

export default overrideObjects