> Task statement symbols highlights

| Symbol | State |
|--|--|
| [x] | Fully Implemented |
| [~] | Partially implemented |
| [@] | Ongoing implementation |
| [!] | Fix as soon as possible (ASAP) |
| [-] | Rejected / Reviewing |
| [*] | Under investigation |
| [ ] | Not started |

## Features work in progress:

#### [builder]
  - [~] Multithreading
  - [*] Dynamic compiler
  - [*] On demand compiler
  - [x] API improvement
  - [x] Show detailed builded sources
  - [ ] Show detailed builder result
  - [ ] WASM Support (C, C++)

#### [addons]
  - [ ] Cloud registry
  - [ ] Security & permissions
  - [~] Dynamic load
  - [~] Addon loader schema (load.addon.js)

#### [core]
  - [*] WebAssembly loader support (WASI)
  - [ ] Process profiler
  - [ ] SignalC (SignalCore)
  - [ ] `VM`
    - [x] Code transcompiler 
    - [x] Scripts loader (nodescript)
    - [~] Exposers dispatcher
  - [x] `ModuleController`
    - [x] Support Aliases overrides
    - [x] Support Paths overrides
    - [x] `importFrom`
  - [] `transcompiler`
    

#### [libraries]
  - [ ] net
    - [ ] websocket
      - [~] websocket.server
      - [ ] websocket.client
  
  - [ ] factory
    - [*] Thing(class) generator

#### [helpers]
  - [x] integrate `syncVersion`
  - [] Bootstrap with project templates
  - [] Publisher script refactoring

#### [cli]
  - [x] `version` improve bump version
  - [x] `publish` performance

#### [#testing]
  - [!] Support JEST testing with runtime
  
#### [#reliability]
  - [!] Unit code tests
  - [!] CI/CD Implementation
#### [#maintainability]
  - [ ] API Documentation
  - [ ] Project documentation & organization
  - [ ] Project policies
  - [ ] Project roadmap