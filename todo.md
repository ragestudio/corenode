## TO DO:

- [] Binary builds
  - [] Nodejs bindings
  - [] OS bindings
  - [] Add packages manager

- (1) [debuggerUI]
    - (1.1) [] WebApp
    - (1.2) [] Dev daemon

- (2) [corenode/builder]
    - (2.1) [x] Reliability improvement
    - (2.2) [~] Multithreading
    - (2.3) [x] API improvement
    - (2.4) [] CLI UI MODE
      - (2.4.1) [x] Show ignored sources
      - (2.4.2) [] Show more builder details
    - (2.5) [~] Dynamic compiler
    - (2.6) [] WASM Support (C, C++)

- (3) [corenode/addons] NRAL | Native Runtimed Addons Loader
    - (3.1) [] Addons registry service
    - (3.2) [~] Dynamic load
    - (3.3) [x] Thread workers & load balancer
    - (3.4) [] Unload addons
    - (3.5) [] Custom events & security
      - (3.5.1) [] Custom version conflict >> (unsafe = unload()) | (unsafe = warn())

- (4) [corenode/core]
  - (4.1) [] WebAssembly support (wasi)
  - (4.2) [] Autoupdate
  - (4.3) [] SignalC (SignalCore)
  - (4.4) [x] VM Transcompiler
  - (4.5) [] Runtime daemon
  - (4.6) [x] VM Runtime scripts loader
  - (4.7) [] Runtime profiler

- (5) [corenode/helpers]
  - (5.1) [] improve versioning
  - (5.2) [] improve bump version
  - (5.3) [x] Publish proyect improve performance
  - (5.4) [] fn() access file || fileExists

- (6) [test-module]
  - (6.1) [] `global & env` Enviroment support Jest
  - (6.2) [] Merge jest runtime with corenode runtime init support

- (7) [] Support client/server polymorphism

- (8) [] Add global API documentation
- (9) [] Add test units to scripts & packages

- (10) [] Create some first-hand plugins & modules