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
      all : ['grunt.js', 'app/**/*.js', 'test/specs/**/*.js'],
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
          'cover/' : 'app/**/*.js'
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
          // optimize: "none",
          baseUrl       : 'temp/local/scripts',
          mainConfigFile: 'app/scripts/config.js',
          name          : '../../../bower_components/almond/almond',
          include       : ['api/snapshot/SimCapiHandler', 'api/snapshot/CapiModel', 
                           'api/snapshot/connectors/CapiConnector', 'api/snapshot/connectors/BackboneConnector'],
          out           : process.env.HTDOCS + '/aelp/local/js/simcapi.js',
          // No wrapping to 'pollute' the global scope with requirejs,
          // so external javascript can make use of simcapi.
          wrap          : false
        }
      }
    }
  });

  // Default task
  grunt.registerTask('default', 'dist:local');
  grunt.registerTask('test', ['cover:compile', 'copy:cover', 'copy:test', 'mocha']);
  
  // Custom tasks
  grunt.registerTask('dist:local', ['clean:local', 'jshint', 'copy:local', 'test', 'requirejs:local']);

  // Loading plugins
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadTasks('grunt-lib');

};