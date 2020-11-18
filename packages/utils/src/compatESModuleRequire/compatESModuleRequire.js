export default function compatESModuleRequire(m) {
    //@ts-ignore
    return m.__esModule ? m.default : m;
}
