import { deburr } from "lodash"

import ADJECTIVES from '@@nodecore/en-adjectives.json'
import NOUNS from '@@nodecore/en-nouns.json'

export function normalizeName(name) {
    return deburr(name)
        .toLowerCase()
        .split(/[^a-z0-9]+/gim)
        .filter((s) => s.length > 0)
        .join("-")
}

export function generateName() {
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