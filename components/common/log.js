/*global LogEntry, Level, console */
define(['common/window', 'tf_logServiceTypes'], 
    function(window) {
  var isDebugEnabled = false;
  var isInfoEnabled = true;
  var isWarnEnabled = true;
  var isErrorEnabled = true;

  var maxEntries = 100;
  var deleteStep = 10;
  var logEntries = [];

  var _started = false;
  var _options;
  var start = function start(options) {
    if (_started) {
      throw new Error('log is already started');
    }
    _started = true;
    _options = (options || {});
  };
  var stop = function() {
    if (! _started) {
      throw new Error('log is not started');
    }
    _started = false;
  };

  var format = function(args) {
    if (args){
      if (args.length > 1) {
        // Substituting {} for the given args.
        var counter = 1;
        return args[0].replace(/\{\}/g, function(substr, num, offset, str) {
          if (counter === args.length) {
            return 'undefined argument';
          }
          return args[counter++];
        });
      } else if (args.length == 1) {
        return args[0];
      }

    }
    // if undefined or null, return itself.
    return args;
  };
  
  var log = function(level, args) {
    var msg = null;
    msg = format(args);

    var caller = getCaller();
    var logEntry = new LogEntry({
      time: new Date().getTime(),
      level: level,
      caller: caller,
      url: window.getLocation(),
      message: msg
    });

    addLogEntry(logEntry);
    if (_options.logToConsole) {
      // Invoking the console in a try/catch block
      // to avoid IE9 to die when the developer tools aren't on.
      try {
        if (console !== undefined) {
          var logdata = msg + " (from " + caller + ")";
          if(level == Level.DEBUG && console.debug !== undefined) {
            console.debug(logdata);
          } else if(level == Level.INFO && console.info !== undefined) {
            console.info(logdata);
          } else if(level == Level.WARN && console.warn !== undefined) {
            console.warn(logdata);
          } else if(level == Level.ERROR && console.error !== undefined) {
            console.error(logdata);
          } else {
            console.log(logdata);
          }
        }
      }
      catch (ouch) {
        // Ignored silently
      }
    }
  };
  var getCaller = function() {
    try {
      var callerName = arguments.callee
        .caller // log
        .caller // debug, info, warn or error
        .caller.name; // The function we're looking for
      callerName = (callerName || '');
      if (callerName === '') {
        return 'anonymous function';
      }
      return callerName;
    }
    catch (error) {
      return 'Cannot get caller name';
    }
  };
  var addLogEntry = function(logEntry) {
    if (logEntries.length >= maxEntries) {
      logEntries = logEntries.slice(deleteStep);
    }
    logEntries.push(logEntry);
  };
  var debug = function() {
    if (isDebugEnabled) {
      log(Level.DEBUG, arguments);
    }
  };
  var info = function() {
    if (isInfoEnabled) {
      log(Level.INFO, arguments);
    }
  };
  var warn = function() {
    if (isWarnEnabled) {
      log(Level.WARN, arguments);
    }
  };
  var error = function() {
    if (isErrorEnabled) {
      log(Level.ERROR, arguments);
    }
  };

  return {
    start: start,
    stop: stop,
    isDebugEnabled: function() { return isDebugEnabled; },
    isInfoEnabled: function() { return isInfoEnabled; },
    isWarnEnabled: function() { return isWarnEnabled; },
    isErrorEnabled: function() { return isErrorEnabled; },
    debug: debug,
    info: info,
    warn: warn,
    error: error,
    format: format,
    getLogEntries: function() { return logEntries; },
    clear: function() {
      logEntries = [];
    }
  };
});