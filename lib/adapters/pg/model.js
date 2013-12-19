"use strict";

var _ = require("lodash")
  , inflection = require("inflection")
  , events = require("events")
  , KitObject = require("./object")
  , queryGenerator = require("./queryGenerator")
  , quote = require("./util").quote
  , md5 = require("./util").md5;

/**
 * Define new model base on provided model name attributes and options
 *
 * @param modelName
 * @param attributes
 * @param options
 * @constructor
 */
var Model = function(modelName, attributes, options) {
  this.options = _.defaults(options, {
    timestamps: false,
    pluralize: true,
    comment: null
  });
  this.kit = this.options.kit;
  this.adapter = this.options.adapter;
  this.options.tableName = this.options.pluralize ? inflection.pluralize(modelName) : modelName;

  if (!_.isString(modelName) || modelName.length === 0) {
    throw new Error("Model name must be a non empty string!");
  }

  if (!_.isObject(attributes) || _.isEmpty(attributes)) {
    throw new Error("Model attributes must be defined!");
  }

  this.attributes = {};
  this.dependencies = [];
  this.relations = {};
  var pkFound = null;

  // iterate over attributes and normalize them
  _.forEach(attributes, function(attrProps, attrName) {

    attrProps.readOnly = attrProps.readOnly || false;
    attrProps.hidden = attrProps.hidden || false;

    if (_.isString(attrProps)) {
      attrProps = { type: attrProps };
    }

    if (_.isArray(attrProps.type)) {
      attrProps.array = true;
    }

    if (_.has(attrProps, "primary") && attrProps.primary) {
      pkFound = attrName;
    }

    if (_.has(attrProps, "reference")) {
      var entity = attrProps.reference.entity || attrProps.reference;
      var field = attrProps.reference.field || entity.primaryKey;

      if (!_.has(entity.attributes, field)) {
        throw new Error("Referenced entity does not contain field " + quote(field));
      }

      attrProps.reference.entity = entity;
      attrProps.reference.field = field;

      if (!_.has(attrProps, "type")) {
        attrProps.type = entity.attributes[field].type;
      }

      this.dependencies.push(entity);
    }

    this.attributes[attrName] = attrProps;
  }, this);

  // add primary key fields if it was not found in attributes
  if (!pkFound) {
    this.attributes.id = { type: this.kit.types.SERIAL, primary: true, service: true };
    pkFound = "id";
  }

  this.primaryKey = pkFound;

  // add timestamp fields if necessary
  if (this.options.timestamps) {
    this.attributes.createdAt = { type: this.kit.types.TIMESTAMPTZ, service: true, default: "NOW()" };
    this.attributes.updatedAt = { type: this.kit.types.TIMESTAMPTZ, service: true, default: "NOW()" };
  }

};

Model.prototype.getDependencies = function() {
  return this.dependencies;
};

Model.prototype.hasMany = Model.prototype.belongsTo = function(model, options) {

};

/**
 * Create table in the database if not exists
 * Also creates required data types
 */
Model.prototype.sync = function() {
  var executor = this.kit.executor({ serial: true })
    , eventEmitter = new events.EventEmitter()
    , $this = this
    , r = queryGenerator.createTable(this.attributes, {
        kit: this.kit,
        executor: executor,
        tableName: this.options.tableName
      });

  executor.query({
    text: r.q,
    name: "create_table_" + md5(r.q),
    values: r.v
  }).on("done", function() {
    eventEmitter.emit("done", $this, { queryData: r });
  }).on("error", function(err) {
    eventEmitter.emit("error", err);
  });

  return eventEmitter;
};

/**
 * Drop the table from the database
 */
Model.prototype.drop = function() {
  var eventEmitter = new events.EventEmitter()
    , $this = this
    , r = queryGenerator.dropTable(this.options.tableName);

  this.kit.query({
    text: r.q,
    name: "drop_table_" + md5(r.q),
    values: r.v
  }).on("done", function() {
      eventEmitter.emit("done", $this, { queryData: r });
  }).on("error", function(err) {
      eventEmitter.emit("error", err);
  });

  return eventEmitter;
};

Model.prototype.build = function(values, options) {
  options = _.extend(options || {}, {
    kit: this.kit,
    adapter: this.adapter,
    model: this
  });
  return new KitObject(values, options);
};

Model.prototype.fromJson = function(json) {
  return this.build(JSON.parse(json));
};

Model.prototype.find = function() {

};

Model.prototype.findOne = function() {

};

Model.prototype.update = function() {

};

Model.prototype.delete = function() {

};

module.exports = Model;
