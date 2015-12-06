define(function(require){
  var _        = require('underscore');
  var App      = require('./App');
  var AppTypes = require('./AppTypes');

  var AppManager = function() {
    this.apps = [];
  };

  AppManager.prototype.getApp = function(appType, appId, questionId) {
    var app = new App(appType, appId, questionId);

    var existing = _.find(this.apps, app.sameIdentity, app);
    if (existing) {
      return existing;
    }

    this.apps.push(app);
    return app;
  };

  AppManager.prototype.getApps = function() {
    return this.apps;
  };

  AppManager.prototype.getAppByUUID = function(appUUID) {
    return _.find(this.apps, function(app) {
      return app.getUUID() === appUUID;
    });
  };

  AppManager.prototype.reset = function() {
    this.apps = [];
  };

  AppManager.prototype.getReadyApps = function() {
    return _.filter(this.apps, function(app) {
      return app.isReady();
    });
  };

  AppManager.prototype.removeApp = function(target) {
    this.apps = _.reject(this.apps, function(app) {
      return app === target;
    });
  };

  AppManager.prototype.getBeagleApps = function() {
    return _.filter(this.apps, function(app) {
      return app.getType() === AppTypes.BEAGLE;
    });
  };

  return AppManager;
});