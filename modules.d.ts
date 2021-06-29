declare namespace corenode {
    export interface getInternalObjects {
    }
    export interface createRuntimeObject {
        key: string;
        thing: object;
    }
    export interface appendToController {
        key: string;
        value: any;
        options: object;
    }
    export interface registerModulesAliases {
        mutation: object;
    }
    export interface registerModulesPaths {
        mutation: object;
    }
    export interface appendToCli {
        entries: any;
    }
    export interface waitForPreloadEvent {
        event: string;
    }
    export interface initialize {

    }
}