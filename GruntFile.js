/*global require, process */
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    version: '0.99',

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
      dot: {
        src : ['test/index.html']
      },
      bamboo : {
        src : '<%= mocha.dot.src %>',
        options : {
          reporter : 'bamboo-mocha-reporter/lib/bamboo.js'
        },
        dest : 'temp/test/mocha.json'
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
      sim_exploded:{
        options:{
          optimize      : "none",
          baseUrl       : 'app/scripts',
          mainConfigFile: 'app/scripts/config.js',
          name          : '../../bower_components/almond/almond',
          include       : ['api/snapshot/Transporter', 'api/snapshot/CapiModel', 'api/snapshot/Controller',
                           'api/snapshot/adapters/CapiAdapter', 'api/snapshot/adapters/BackboneAdapter'
                           ],
          out           : 'dist/pipit-<%= version %>.js',
          wrap          : {
            startFile: 'app/scripts/intro.js',
            endFile  : 'app/scripts/outro.js'
          }
        }
      },
      sim_minified:{
        options: {
          baseUrl        : '<%= requirejs.sim_exploded.options.baseUrl %>',
          mainConfigFile : '<%= requirejs.sim_exploded.options.mainConfigFile %>',
          name           : '<%= requirejs.sim_exploded.options.name %>',
          include        : '<%= requirejs.sim_exploded.options.include %>',
          out            : 'dist/pipit-<%= version %>.min.js',
          wrap           : '<%= requirejs.sim_exploded.options.wrap %>'
        }
      }
    }
  });

  // Default task
  grunt.registerTask('default', 'local');

  grunt.registerTask('test', ['cover:compile', 'copy:cover', 'copy:test', 'mocha:dot']);
  grunt.registerTask('test-rel', ['cover:compile', 'copy:cover', 'copy:test', 'mocha:bamboo']);

  grunt.registerTask('local', ['clean', 'jshint', 'test', 'requirejs:sim_minified',
        'requirejs:sim_exploded']);
  grunt.registerTask('rel', ['clean', 'jshint', 'test-rel', 'requirejs:sim_minified',
        'requirejs:sim_exploded']);

  // Loading plugins
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadTasks('grunt-lib');

};
