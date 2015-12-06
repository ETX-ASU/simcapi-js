define(function(require) {

  var uuid = require('./util/uuid');
  var AppTypes = require('./AppTypes');

  var App = function(appType, appId, questionId) {
    this.appType = appType;
    this.appId = appId;
    this.questionId = questionId;
    this.appUUID = uuid();

    this.ready = null;
  };

  App.prototype.setMetadata = function(options) {
    this.iframe = options.iframe;
    this.transportVersion = options.transportVersion || 0;
  };

  App.prototype.hasMetadata = function() {
    return !!this.iframe;
  };

  App.prototype.setReady = function(value) {
    this.ready = value;
  };

  App.prototype.getCompositeID = function() {
    return this.questionId ?  this.appId + "|" + this.questionId : this.appId;
  };

  App.prototype.getUUID = function() {
    return this.appUUID;
  };

  App.prototype.sameIdentity = function(app) {
    return this.appType === app.appType &&
      this.getCompositeID() === app.getCompositeID();
  };

  App.prototype.isReady = function() {
    return !!this.ready;
  };

  App.prototype.getIFrame = function() {
    return this.iframe;
  };

  App.prototype.getCapiPrefix = function() {
    return (this.appType === AppTypes.BEAGLE ? "beagle." : "stage.") + this.appId;
  };

  App.prototype.getType = function() {
    return this.appType;
  };

  return App;
});