/* Utility class to display messages in a modal dialog.
 * It uses common/Message as a model. It uses the following properties:
 * - message: the html to display as a message.
 * - type: 'INFO', 'WARNING' or 'ERROR'
 * - buttons: an array with button identifiers or button definitions. e.g.:
 *     ['YES', 'NO', 'OK', 'CANCEL', { id: 'CUSTOM', label: 'Do my action' }].
 * - callback: function that will be call when the dialog is closed.
 *     The id of the pressed button will be passed. If the message is closed
 *     without using a button (using the 'esc' key, for example),
 *     'CANCEL' will be passed.
 * Examples:
 * - Display a message with three buttons: YES, NO and CANCEL
 *     new MessageBox({ model: new Message({ message: 'my message', buttons: ['YES', 'NO', 'CANCEL'] }) });
 * - Display a message with a custom button:
 *     new MessageBox(
 *       model: new Message({
 *           message: 'my message',
 *           buttons: [{ id: 'COPY', label: 'Copy' }, 'CANCEL'] }) });
 */
define(function(require) {
  var _          = require('underscore'),
      $          = require('jquery'),
      Backbone   = require('backbone'),
      Message    = require('common/Message'),
      template   = require('text!common/messageBox.html'),
      check      = require('common/check');

      require('bootstrap-modal');

  var _validButtonIds = ['YES', 'NO', 'OK', 'CANCEL'];
  var _buttonDefinitions = [];
  _buttonDefinitions.YES    = { id: 'YES', label: 'Yes' };
  _buttonDefinitions.NO     = { id: 'NO', label: 'No' };
  _buttonDefinitions.OK     = { id: 'OK', label: 'OK' };
  _buttonDefinitions.CANCEL = { id: 'CANCEL', label: 'Cancel' };

  var _buttonTemplate = _.template(
    '<a class="btn" ' +
      '<% if(buttonDefinition.href) { %>' +
        'href="<%= buttonDefinition.href %>" target="_blank"' +
      '<% } %>' +
    'name="<%= buttonDefinition.id %>"><%= buttonDefinition.label %></a>');

  var MessageBoxView = Backbone.View.extend({
    className: 'messageBoxView',
    initialize: function() {
      check(this.model, {msg:'Invalid Model'}).isOfType(Message);

      var buttons = this.model.get('buttons'),
          callback = this.model.get('callback');

      if (! buttons || buttons.length === 0) {
        throw new Error('At least one button must be passed');
      }
      _.each(buttons, function(button) {
        if (typeof button === 'string') { // button is a button id
          if (!_.contains(_validButtonIds, button)) {
            throw new Error('Invalid button id: ' + button);
          }
          if (button !== 'OK' && !callback) {
            throw new Error('When using action buttons a callback is necessary');
          }
        }
        else { // button is a custom button
          check(button.id, {msg:'Custom button must have an id'}).isString();
          check(button.label, {msg:'Custom button must have a label'}).isString();

          if (!check(button.href, {dontThrow:true}).isString()) {
            // if button doesn't have a hyperlink, it must have a callback
            check(callback, {msg:'When using custom buttons a callback is necessary'}).isFunction();
          } else {
            // if button has a hyperlink, it must specify the target window
            check(button.target, {msg:'When using href, a target must be specified'}).isString();
          }
        }
      });

      this.$el = $(_.template(template)({ message: this.model }));
      this.$buttons = this.$('.modal-footer');
      // Adding the buttons
      var self = this;
      _.each(buttons, function(button) {
        var buttonDefinition = null;
        if (typeof button === 'string') {
          buttonDefinition = _buttonDefinitions[button];
        }
        else { // Custom button
          buttonDefinition = button;
        }
        self.$buttons.append(_buttonTemplate({ buttonDefinition: buttonDefinition }));
      });

      this.$el.modal().on('hidden', function() {
        if (callback) { callback('CANCEL'); }
      });
      $('.modal-footer', this.$el).on('click', 'a', this, this.onButtonClick);

      // Message is displayed by default
      this.show();
    },
    show: function() {
      this.$el.modal('show');
    },
    hide: function() {
      this.$el.modal('hide');
      // A dialog should be displayed once, so clearing resources is necessary
      this.remove();
    },
    onButtonClick: function(event) {
      var callback = event.data.model.get('callback');
      if (callback) {
        callback($(this).attr('name'));
      }
      event.data.hide();
    }
  });

  return MessageBoxView;
});