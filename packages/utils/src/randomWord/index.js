import { deburr } from "lodash"

const ADJECTIVES = require("./en-adjectives.js")
const NOUNS = require("./en-nouns.js")

export function normalize(name) {
    return deburr(name)
        .toLowerCase()
        .split(/[^a-z0-9]+/gim)
        .filter((s) => s.length > 0)
        .join("-")
}

export function generate() {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min
    }

    return (
        ADJECTIVES[getRandomInt(0, ADJECTIVES.length + 1)] +
        "-" +
        NOUNS[getRandomInt(0, NOUNS.length + 1)] +
        "-" +
        getRandomInt(1, 99)
    )
}