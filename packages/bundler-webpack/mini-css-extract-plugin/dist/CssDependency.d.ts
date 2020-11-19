export var __esModule: boolean;
declare var _default: typeof CssDependency;
export default _default;
declare const CssDependency_base: any;
declare class CssDependency extends CssDependency_base {
    [x: string]: any;
    constructor({ identifier, content, media, sourceMap }: {
        identifier: any;
        content: any;
        media: any;
        sourceMap: any;
    }, context: any, identifierIndex: any);
    identifier: any;
    identifierIndex: any;
    content: any;
    media: any;
    sourceMap: any;
    context: any;
    getResourceIdentifier(): string;
}
