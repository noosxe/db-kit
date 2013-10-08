var _ = require('lodash')
  , async = require('async')
  , events = require('events')
  , Executor = require('./executor')
  , quote = require('./util').quote;

module.exports = (function() {
  "use strict";

  var KitObject = function(values, options) {
    var $this = this;

    $this.__defineGetter__('__model', function() {
      return options.model;
    });
    $this.__defineGetter__('__kit', function() {
      return options.kit;
    });

    $this.__values = {};

    _.forEach(this.__model.attributes, function(attrProps, attrName) {
      var value = values[attrName] || null;
      if (attrProps.readOnly && !attrProps.hidden && !attrProps.service && _.isNull(value)) {
        throw new Error('field ' + quote(attrName) + ' was defined as readOnly, but no value is provided!');
      }

      if (attrProps.reference) {
        value = attrProps.reference.entity.build(value, _.clone(options));
      }

      // generate setter
      if (!attrProps.readOnly && !attrProps.service) {
        $this.__defineSetter__(attrName, function(newVal) {
          $this.__values[attrName] = newVal;
        });
      }

      // generate getter
      $this.__defineGetter__(attrName, function() {
        return $this.__values[attrName] || null;
      });

      $this.__values[attrName] = value;
    }, $this);
  };

  KitObject.prototype.toJson = function() {
    return JSON.stringify(this.__values);
  };

  KitObject.prototype.save = function() {
    var executor = new Executor({ inTransaction: true, kit: this.__kit });
    var eventEmitter = new events.EventEmitter();

    var $this = this;

    var r = {};

    eventEmitter.on('internalDone', function() {
      eventEmitter.emit('done', $this, { queryData: r });
    });

    executor.finish();

    return eventEmitter;
  };

  KitObject.prototype.reload = function() {

  };

  KitObject.prototype.delete = function() {
    var eventEmitter = new events.EventEmitter();

    return eventEmitter;
  };

  return KitObject;

}());
