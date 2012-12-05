/*global jasmine, window */
require([
  'jquery',
  'specs/api/snapshot/SnapshotSegment.spec',
  'specs/api/snapshot/SimCapiHandler.spec',
  'specs/api/snapshot/SimCapi.spec',
  'specs/api/snapshot/SharedSimData.spec'
], function($) {
  var runner = function() {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    var htmlReporter = new jasmine.HtmlReporter();
    // Global so it can be read from the testRunner.coffee
    window.consoleReporter = new jasmine.ConsoleReporter();
    var junitReporter = new jasmine.JUnitXmlReporter('../temp/test-reports/');

    jasmineEnv.addReporter(htmlReporter);
    jasmineEnv.addReporter(window.consoleReporter);
    jasmineEnv.addReporter(junitReporter);

    jasmineEnv.specFilter = function(spec) {
      return htmlReporter.specFilter(spec);
    };

    jasmineEnv.execute();
  };

  $(document).ready(runner);
});
