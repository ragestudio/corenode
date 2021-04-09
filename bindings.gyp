 {
      "targets": [
        {
          "target_name": "exampleAddon",
          "cflags": ["-Wall", "-std=c++11"],
          "sources": [ "" ],
          "conditions":[
            ["OS=='linux'", {
              "sources": [ "" ]
              }],
            ["OS=='mac'", {
              "sources": [ "" ]
            }],
            ["OS=='win'", {
              "sources": [ "" ]
            }]
          ], 
          "xcode_settings": {
            "OTHER_CFLAGS": [
              "-std=c++11"
            ]
          },
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": "1 # /EHsc"
            }
          },
          "include_dirs" : [
            "<!(node -e \"require('nan')\")"
          ]
        }
      ]
    }