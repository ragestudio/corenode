## TO DO:

- [] Binary builds
  - [] Nodejs bindings
  - [] OS bindings
  - [] Add packages manager

- (1) [debuggerUI]
    - (1.1) [] WebApp
    - (1.2) [] Dev daemon

- (2) [builder]
    - (2.1) [x] Reliability improvement
    - (2.2) [~] Multithreading
    - (2.3) [x] API improvement
    - (2.4) [] CLI UI MODE
      - (2.4.1) [] Show ignored sources
      - (2.4.2) [] Show more builder details
    - (2.5) [~] Dynamic compiler
    - (2.6) [] WASM Support (C, C++)

- (3) [corenodejs/modules] NRML | Native Runtimed Module Loader
    - (3.1) [] Support modole cloud publishing
    - (3.2) [] Dynamic load
    - (3.3) [] Thread workers & load balancer
    - (3.4) [] Module hierarchical load order from internal to external
    - (3.5) [] Unload modules
    - (3.6) [] Custom events & security
      - (3.6.1) [] Custom version conflict >> (unsafe = unload()) | (unsafe = warn())

- (4) [corenode/core]
  - (4.1) [] Module installer
  - (4.2) [] WebAssembly support (wasi)
  - (4.3) [] Autoupdate
  - (4.4) [] SignalC (SignalCore)
  - (4.5) [] VM Transcompiler
  - (4.6) [] Runtime daemon
  - (4.7) [] VM Runtime scripts loader
  - (4.8) [] Runtime profiler

- (5) [corenodejs/helpers]
  - (5.1) [] improve versioning
  - (5.2) [] improve bump version
  - (5.3) [] Publish proyect improve performance
  - (5.4) [] fn() access file || fileExists

- (6) [test-module]
  - (6.1) [] `global & env` Enviroment support Jest
  - (6.2) [] Merge jest runtime with corenode runtime init support

- (7) [] Support client/server polymorphism

- (8) [] Add global API documentation
- (9) [] Add test units to scripts & packages

- (10) [] Cloudlink plugin
- (11) [] Create some first-hand plugins & modules