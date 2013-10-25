/*globals require, window*/
window.SimCapi = {
	BackboneAdapter : require('api/snapshot/connectors/BackboneAdapter').getInstance(),
	CapiAdpater: require('api/snapshot/connectors/CapiAdapter').getInstance(),
	Controller: require('api/snapshot/Controller')
};

window.SimCapi.CapiAdpater.CapiModel = require('api/snapshot/CapiModel');