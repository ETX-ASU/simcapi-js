/*global require */
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    // Clean
    clean: {
      local: {
        src: ['temp/local']
      },
      prod: {
        src: ['temp/prod', 'dist/prod']
      },
      test: {
        src: ['temp/specs']
      }
    },

    // Lint
    jshint: {
      options: {
        curly  : true,
        eqeqeq : true,
        immed  : true,
        latedef: true,
        newcap : true,
        noarg  : true,
        sub    : true,
        undef  : true,
        boss   : true,
        eqnull : true
      },
      globals: {
        exports   : true,
        module    : false,
        define    : false,
        describe  : false,
        it        : false,
        beforeEach: false,
        afterEach : false,
        expect    : false,
        spyOn     : false
      }
    },
    lint: {
      files: ['grunt.js', 'app/**/*.js', 'test/specs/**/*.js']
    },
    coffeelint: {
      files: ['app/scripts/**/*.coffee', 'test/specs/**/*.coffee']
    },
    coffeelintOptions: {
      "max_line_length": {
        "value": 100,
        "level": "error"
      }
    },

    // Compile
    coffee: {
      local: {
        options: {
          bare         : true,
          preserve_dirs: true,
          base_path    : 'app/scripts'
        },
        src : ['app/scripts/**/*.coffee'],
        dest: 'temp/local/scripts/'
      },
      prod: {
        options: {
          bare         : true,
          preserve_dirs: true,
          base_path    : 'app/scripts'
        },
        src : ['app/scripts/**/*.coffee'],
        dest: 'temp/prod/scripts/'
      },
      test: {
        options: {
          bare         : true,
          preserve_dirs: true,
          base_path    : 'test/specs'
        },
        src : ['test/specs/**/*.coffee'],
        dest: 'temp/specs/'
      }
    },

    // Copy
    copy: {
      local: {
        // All but .coffee files because the 'coffee' task will take care of it
        files: {
          'dist/local/index.html': 'index.html',
          'temp/local/scripts/'  : 'app/scripts/**/*.!(coffee)'
        }
      },
      prod: {
        // No need to copy the other files because the 'requirejs' task will take care of it
        files: {
          'dist/prod/index.html': 'dist-index.html'
        }
      },
      test: {
        files: {
          'temp/specs/api/snapshot/': 'test/specs/**/*.js'
        }
      }
    },

    // Watch
    watch: {
      cscripts: {
        files: '<config:coffeelint.files>',
        // Removing the lint task temporarily
        tasks: 'lint coffeelint coffee:local copy:local coffee:test test'
      },
      jsscripts: {
        files: '<config:lint.files>',
        // Removing the lint task temporarily
        tasks: 'lint copy:local copy:test test'
      }
    },

    // Tests
    shell: {
      jasmine: {
        command: 'phantomjs testRunner.coffee index.html',
        execOptions: {
          cwd: 'test'
        }
      }
    },

    // Dist
    requirejs: {
      prod: {
        options: {
          // Need to debug the release code? Uncomment the optimize flag
          // to get a readable javascript output
          // optimize: "none"
          baseUrl       : 'temp/prod/scripts',
          mainConfigFile: 'app/scripts/config.js',
          name          : '../../../components/almond/almond',
          include       : 'main',
          insertRequire : ['main'],
          out           : 'dist/prod/scripts/simcapi.js',
          wrap          : true
        }
      }
    },

    compress: {
      zip: {
        options: {
          rootDir: 'api',
          basePath: 'api'
        },
        files: {
          'dist/prod/simcapi.zip': 'temp/local/scripts/api/**/*'
        }
      }
    },

    // Hashing of resources
    hashres: {
      prod: {
        files: ['dist/prod/scripts/*.js', 'dist/prod/styles/*.css'],
        out  : 'dist/prod/index.html'
      }
    }
  });


  // Default task
  grunt.registerTask('default', 'lint coffeelint coffee co test');
  // Custom tasks
  grunt.registerTask('dist:local', 'clean:local lint coffeelint copy:local copy:test coffee:local coffee:test test');
  grunt.registerTask('dist:prod',  'clean:prod  lint coffeelint copy:prod  copy:test coffee:prod  coffee:test test requirejs:prod hashres:prod');
  grunt.registerTask('dist:all',   'clean       lint coffeelint copy                 coffee       coffee:test test requirejs');
  // Aliasing 'jasmine' task
  grunt.registerTask('test', 'shell:jasmine');

  // Loading plugins
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-coffee');
  grunt.loadNpmTasks('grunt-coffeelint');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-hashres');

};