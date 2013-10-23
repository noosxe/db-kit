var _ = require('lodash')
  , async = require('async')
  , events = require('events')
  , Executor = require('./executor')
  , queryGenerator = require('./queryGenerator')
  , quote = require('./util').quote
  , md5 = require('./util').md5;

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

  KitObject.prototype.save = function(options) {
    options = _.clone(options) || {};
    var ownExecutor = false;
    var executor;
    if (options.executor) {
      executor = options.executor;
    } else {
      executor = new Executor({ inTransaction: true, kit: this.__kit });
      ownExecutor = true;
    }

    var eventEmitter = new events.EventEmitter();

    var $this = this;

    var pKey = this.__model.primaryKey;

    var func;

    if (_.isNull(this.__values[pKey])) {
      func = queryGenerator.insert;
    } else {
      func = queryGenerator.update;
    }

    var r = func.call(
      queryGenerator,
      this.__model.attributes,
      this.__values,
      _.extend(_.clone(this.__model.options), {
        primaryKey: this.__model.primaryKey,
        executor: executor,
        eventEmitter: eventEmitter
      })
    );

    eventEmitter.on('internalDone', function(results) {
      eventEmitter.emit('done', $this, { queryData: r });
    });

    eventEmitter.on('internalError', function(err) {
      if (ownExecutor) {
        executor.revert();
      }
      eventEmitter.emit('error', err);
    });


    this.__kit.query({
      text: r.q,
      name: 'insert_into_' + md5(r.q),
      values: r.v
    }, _.defaults(_.clone(this.options), {
      executor: executor,
      eventEmitter: eventEmitter
    }));

    if (ownExecutor) {
      executor.finish();
    }

    return eventEmitter;
  };

  KitObject.prototype.reload = function() {
    var eventEmitter = new events.EventEmitter();

    return eventEmitter;
  };

  KitObject.prototype.delete = function() {
    var eventEmitter = new events.EventEmitter();

    return eventEmitter;
  };

  return KitObject;

}());
