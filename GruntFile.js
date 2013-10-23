/*global require, process */
module.exports = function(grunt) {

  var rdefineEnd = /\}\);[^}\w]*$/;
  
  //Strips require as a dependency
  //Code from jQuery build.js
  function onBuildWrite(name, path, contents){
    // Convert var modules
    if ( /.\/var\//.test( path ) ) {
      contents = contents
        .replace( /define\([\w\W]*?return/, "var " + (/var\/([\w-]+)/.exec(name)[1]) + " =" )
        .replace( rdefineEnd, "" );

    // Sizzle treatment
    } else if ( /^sizzle$/.test( name ) ) {
      contents = "var Sizzle =\n" + contents
        // Remove EXPOSE lines from Sizzle
        .replace( /\/\/\s*EXPOSE[\w\W]*\/\/\s*EXPOSE/, "return Sizzle;" );

    } else {

      // Ignore jQuery's exports (the only necessary one)
      if ( name !== "jquery" ) {
        contents = contents
          .replace( /\s*return\s+[^\}]+(\}\);[^\w\}]*)$/, "$1" )
          // Multiple exports
          .replace( /\s*exports\.\w+\s*=\s*\w+;/g, "" );
      }

      // Remove define wrappers, closure ends, and empty declarations
      contents = contents
        .replace( /define\([^{]*?{/, "" )
        .replace( rdefineEnd, "" );

      // Remove anything wrapped with
      // /* ExcludeStart */ /* ExcludeEnd */
      // or a single line directly after a // BuildExclude comment
      contents = contents
        .replace( /\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig, "" )
        .replace( /\/\/\s*BuildExclude\n\r?[\w\W]*?\n\r?/ig, "" );

      // Remove empty definitions
      contents = contents
        .replace( /define\(\[[^\]]+\]\)[\W\n]+$/, "");
    }
    return contents;
  };




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
          //optimize: "none",
          baseUrl       : 'temp/local/scripts',
          mainConfigFile: 'app/scripts/config.js',
          exclude       : ['jquery', 'underscore', 'check', 'backbone', 'almond'],
          include       : ['api/snapshot/SimCapiHandler', 'api/snapshot/CapiModel', 
                           'api/snapshot/connectors/CapiConnector', 'api/snapshot/connectors/BackboneConnector',
                           ],
          wrap : {
            startFile: 'app/scripts/intro.js'
          },
          out           : process.env.HTDOCS + '/aelp/local/js/simcapi.js',
          onBuildWrite  : onBuildWrite
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