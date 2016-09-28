/*global require, process */
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    version: "<%= pkg.version %>",


    // Clean
    clean: {
      src: ['temp', 'dist']
    },

    // Lint
    jshint: {
      all : ['Gruntfile.js', 'app/scripts/**/*.js', 'test/specs/**/*.js',
             '!app/scripts/intro*.js', '!app/scripts/outro*.js'],
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
        onecase : true,
        scripturl: true,
        globals: {
          exports   : true,
          module    : false,
          define    : false,
          describe  : false,
          xdescribe : false,
          it        : false,
          xit       : false,
          beforeEach: false,
          afterEach : false,
          expect    : false,
          spyOn     : false
        }
      }
    },

    template:{
      transporterVersion: {
        'options': {
          'data': {
            'version': "<%= version %>"
          }
        },
        'files': {
          'temp/local/scripts/api/snapshot/Transporter.js': ['temp/local/scripts/api/snapshot/Transporter.js']
        }
      }
    },

    // Copy
    copy: {
      local: {
        files: [
          {dest : 'temp/local/scripts/', src : ['**'], cwd : 'app/scripts/', expand : true}
        ]
      },
      test: {
        files: [
          {dest : 'temp/local/specs/', src : ['**'], cwd : 'test/specs/', expand : true}
        ]
      }
    },

    mocha : {
      dot: {
        src : ['test/index.html']
      }
    },

    update_json:{
      options: {
        src: 'package.json',
        indent: '  '
      },
      bower:{
        src: 'package.json',    // where to read from
        dest: 'bower.json',     // where to write to
        // the fields to update, as a String Grouping
        fields: 'version'
      }
    },

    // Watch
    watch: {
      jsscripts: {
        files: '<%= jshint.all %>',
        tasks: ['jshint', 'copy:local', 'copy:test', 'test']
      }
    },

    // Dist
    requirejs: {
      local: {
        options: {
          optimize: "none",
          baseUrl       : 'temp/local/scripts',
          mainConfigFile: 'app/scripts/config.js',
          name          : '../../../bower_components/almond/almond',
          include       : ['api/snapshot/Transporter', 'api/snapshot/CapiModel','api/snapshot/adapters/CapiAdapter', 'api/snapshot/adapters/BackboneAdapter'],
          wrap          : false,
          out           : 'dist/local/simcapi.js'
        }
      },

      prod:{
        options:{
          baseUrl       : 'temp/local/scripts',
          mainConfigFile: 'app/scripts/config.js',
          name          : '../../../bower_components/almond/almond',
          include       : ['api/snapshot/Transporter', 'api/snapshot/CapiModel','api/snapshot/adapters/CapiAdapter', 'api/snapshot/adapters/BackboneAdapter'],
          out           : 'dist/simcapi-<%= version %>/simcapi.min.js',
          wrap          : {
            startFile: 'app/scripts/intro.js',
            endFile  : 'app/scripts/outro.js'
          }
        }
      }
    }
  });

  // Default task
  grunt.registerTask('default', ['dist:local']);
  grunt.registerTask('test', ['copy:test', 'mocha:dot']);

  // Custom tasks
  grunt.registerTask('dist:local', ['clean', 'jshint', 'copy:local', 'template', 'test', 'requirejs:local']);
  grunt.registerTask('rel', ['clean', 'jshint', 'update_json', 'copy:local', 'template', 'test', 'requirejs:prod']);

  // Loading plugins
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-update-json');
  grunt.loadNpmTasks('grunt-template');
};
