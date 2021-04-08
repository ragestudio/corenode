## Differences between corenode "Modules" & "Plugins"

#### Modules 
> - Extends the runtime
> - Has an initializator with builtin libraries
> - Can be identified as internal or external
> - Cannot be disabled (loader control), will always be loaded if a source exists in the local registry
> - Internal modules cannot be listed with registry (will forced autoloaded)

#### Plugins 
> - Extends the application
> - Cannnot be initializated with the runtime, will be available after the runtime finishes initialize
> - Has access to builtin libraries and modules libraries
> - Can be loader controlled (ex. can be disabled)
> - Cannot be listed with registry (plugins cannot able to autoload or installed automatically)

### List of operating properties
| |MODULES| PLUGINS |
|--|--|--|
| Has registry | Yes | No |
| Has source control | Yes | No |
| Has an initializator | Yes | No |
| Extends the runtime | Yes | No |
| Extends application | Yes | Yes |
| Has API management | Yes | Yes |
| Loader controlled | No | Yes |