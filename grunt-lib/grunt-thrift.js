/**
 * grunt task to compile thrift files. Must have thrift installed and globaly
 * available as a command.
 */
module.exports = function(grunt) {

    grunt.registerMultiTask('thrift', 'Compiles thrift files', function() {

        var languages = this.data.languages;
        var out = this.data.out;
        var files = grunt.file.expand(this.data.src);
        grunt.file.mkdir(out);

        // create a variable to wait for thriftgen because it is async
        var completed = 0;
        var done = this.async();

        // thrift gen for each language
        languages.forEach(function(language) {

            // thirft gen for each file
            files.forEach(function(file) {
                var args = [];

                if (out) {
                    args.push('-out');
                    args.push(out);
                }

                args.push('--gen');
                args.push(language);
                args.push(file);

                grunt.log.writeln('thrift ' + args.join(' '));

                var spawn = require('child_process').spawn;
                var thrift = spawn('thrift', args);

                thrift.stderr.on('data', function(data) {
                    grunt.log.error('stderr : ' + data);
                    grunt.warn(new Error(
                            'Cannot compile one or more thrift files.'));
                });

                thrift.on('exit', function(code) {
                    completed++;
                    if (completed >= files.length) {
                        done();
                    }
                });
            });
        });

    });
};