/* Removes undesired characters from a string that is supposed to
 * to be a file name. */
define(function(require) {
  
  var log     = require('log'),
      trimmer = require('common/trimmer');

  var regex = /^[^a-zA-Z_]+|[^a-zA-Z_0-9 \.\-]+/g;

  return function(fileName) {
    log.info('Sanitising: {}', fileName);

    // Using the trimmer to remove spaces, tabs and break-lines
    // at beginning and end of 'fileName'.
    return trimmer(fileName).replace(regex, '');
  };
});