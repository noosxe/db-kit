var _ = require('lodash')
  , events = require('events')
  , Executor = require('./executor')
  , queryGenerator = require('./queryGenerator')
  , quote = require('./util').quote
  , md5 = require('./util').md5;

module.exports = (function() {
  "use strict";

  var KitObject = function(values, options) {
    var $this = this;

    $this.__options = options;

    $this.__defineGetter__('__model', function() {
      return options.model;
    });
    $this.__defineGetter__('__kit', function() {
      return options.kit;
    });

    $this.__defineGetter__('__adapter', function() {
      return options.adapter;
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
    options = options || {};
    var executor = options.executor || this.__kit.executor({ transaction: true })
      , eventEmitter = new events.EventEmitter()
      , $this = this
      , pKey = this.__model.primaryKey
      , func;

    if (_.isNull(this.__values[pKey])) {
      func = queryGenerator.insert;
    } else {
      func = queryGenerator.update;
    }

    var r = func.call(
      queryGenerator,
      this.__model.attributes,
      this.__values,
      {
        tableName: this.__model.options.tableName,
        primaryKey: this.__model.primaryKey,
        timestamps: this.__model.options.timestamps,
        executor: executor
      }
    );

    executor.query({
      text: r.q,
      name: 'insert_into_' + md5(r.q),
      values: r.v
    }).on('done', function(rows) {
      if (rows.length > 0) {
        _.forEach(rows[0], function(fieldValue, fieldName) {
          this.__values[fieldName] = fieldValue;
        }, $this);
      }
      if (!options.executor) {
        executor.finish();
      }
      eventEmitter.emit('done', $this, { queryData: r });
    }).on('error', function(err) {
      eventEmitter.emit('error', err);
    });

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
