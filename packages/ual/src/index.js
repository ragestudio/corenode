const axios = require('axios')
const defaultOrigin = "https://registry.ragestudio.net"

const axiosInstance = axios.create({
    baseURL: defaultOrigin
})

function getAuth() {
    //TODO
}

function remove() {
    //TODO
}

function add() {
    //TODO
}

function checkValidity() {
    //TODO
}

function isUpToDate() {
    //TODO
}

function fetchManifest(id) {
    //TODO 
}

module.exports = {
    getAuth,
    remove,
    add,
    checkValidity,
    isUpToDate,
    fetchManifest,
    axiosInstance
}