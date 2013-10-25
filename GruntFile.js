/*global require, process */
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    // Clean
    clean: {
      local: {
        src: ['temp/local']
      },
      test: {
        src: ['temp/specs']
      }
    },

    // Lint
    jshint: {
      all : ['grunt.js', 'app/scripts/api/**/*.js', 'test/specs/**/*.js'],
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
        eqnull : true,
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
    },

    // Copy
    copy: {
      local: {
        files: [
          {dest : 'temp/local/scripts/', src : ['**'], cwd : 'app/scripts/', expand : true},
        ]
      },
      test: {
        files: [
          {dest : 'temp/local/specs/', src : ['**'], cwd : 'test/specs/', expand : true}
        ]
      },
      cover : {
        files : [
          {dest : 'cover/app/specs/', src : ['**'], cwd : 'test/specs/', expand : true}
        ]
      }
    },

    cover : {
      compile : {
        files : {
          'cover/' : 'app/scripts/api/**/*.js'
        }
      }
    },
    
    mocha : {
      index : ['test/index.html']
    },
    
    // Watch
    watch: {
      jsscripts: {
        files: '<config:lint.files>',
        // Removing the lint task temporarily
        tasks: 'lint copy:local copy:test test'
      }
    },

    // Dist
    requirejs: {
      local: {
        options: {
          // Need to debug the release code? Uncomment the optimize flag
          // to get a readable javascript output
          //optimize: "none",
          baseUrl       : 'temp/local/scripts',
          mainConfigFile: 'app/scripts/config.js',
          name          : '../../../bower_components/almond/almond',
          include       : ['api/snapshot/SimCapiHandler'],
          wrap          : false,
          out           : process.env.HTDOCS + '/aelp/local/js/simcapi.js'
        }
      },

      exploded:{
        options:{
          optimize      : "none",
          baseUrl       : 'temp/local/scripts',
          mainConfigFile: 'app/scripts/config.js',
          name          : '../../../bower_components/almond/almond',
          include       : ['api/snapshot/SimCapi', 'api/snapshot/CapiModel', 'api/snapshot/Controller',
                           'api/snapshot/connectors/CapiAdapter', 'api/snapshot/connectors/BackboneAdapter',
                           ],
          out           : 'dist/simcapi.js',
          wrap          : {
            startFile: 'app/scripts/intro.js',
            endFile  : 'app/scripts/outro.js'
          }
        }
      },
      minified:{
        options:{
          baseUrl       : 'temp/local/scripts',
          mainConfigFile: 'app/scripts/config.js',
          name          : '../../../bower_components/almond/almond',
          include       : ['api/snapshot/SimCapi', 'api/snapshot/CapiModel', 'api/snapshot/Controller',
                           'api/snapshot/connectors/CapiAdapter', 'api/snapshot/connectors/BackboneAdapter',
                           ],
          out           : 'dist/simcapi.min.js',
          wrap          : {
            startFile: 'app/scripts/intro.js',
            endFile  : 'app/scripts/outro.js'
          }
        }
      }
    }
  });

  // Default task
  grunt.registerTask('default', 'dist:local');
  grunt.registerTask('test', ['cover:compile', 'copy:cover', 'copy:test', 'mocha']);
  
  // Custom tasks
  grunt.registerTask('dist:local', ['clean:local', 'jshint', 'copy:local', 'test', 'requirejs:local']);

  grunt.registerTask('dist:release', ['dist:local', 'requirejs:exploded', 'requirejs:minified']);
  // Loading plugins
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadTasks('grunt-lib');

};