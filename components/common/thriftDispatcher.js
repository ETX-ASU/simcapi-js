/*global document */
define(function(require){
  
  var $        = require('jquery'),
      _        = require('underscore'),
      log      = require('log'),
      eventBus = require('eventBus'),
      Message  = require('common/Message');
  
  var dispatch = function(context, serviceFunc, params, successCallback, failureCallback, requestOptions) {
    var myOptions, ajaxElement,
        errorListener, completeListener, sendListener, finalParams;

    // additional parameters if we ever need it
    //   blockingView: [true | false] true iff the view should be blocked
    requestOptions = requestOptions || {};
    
    ajaxElement = document.createElement('div');

    errorListener = $(ajaxElement).ajaxError(function(event, request, options, error) {
      if (options.context === context) {
        if (myOptions === options) {
          log.error('thrift service could not be executed, error: {}', error);
          eventBus.trigger('message:notification', new Message({ 
              type: 'ERROR', message: 'Error: cannot communicate with the server' }));
          if (failureCallback) { failureCallback.apply(options.context, [error]); }
        }
      }
    });
    completeListener = $(ajaxElement).ajaxComplete(function(event, xhr, options) {
      if (options.context === context) {
        if (myOptions === options) {
          errorListener.unbind('ajaxError');
          completeListener.unbind('ajaxComplete');
          
          if (requestOptions.blockingView) {
            eventBus.trigger('unblockUI');
          }
        }
      }
    });
    sendListener = $(ajaxElement).ajaxSend(function(event, xhr, options) {
      // I need the options to check that the error comes from the request
      // initiated by this dispatcher
      myOptions = options;
      sendListener.unbind('ajaxSend');
      
      if (requestOptions.blockingView) {
        eventBus.trigger('blockUI');
      }
    });

    finalParams = _.toArray(params);
    // Ensuring that there's a successCallback to force thrift to use
    // jquery to send the request, so we can use jquery global listeners.
    successCallback = (successCallback || function() {});
    finalParams.push(successCallback);

    try {
      log.info('Invoking thrift service: {}. Params: {}', context, params);
      serviceFunc.apply(context, finalParams);
    }
    catch (error) {
      eventBus.trigger('serviceError', error);
      if (failureCallback) { failureCallback.apply(error); }
    }
  };

  return { dispatch: dispatch };
});