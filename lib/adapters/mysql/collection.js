"use strict";

var _ = require("lodash"),
	events = require("events"),
	KitObject = require("./object"),
	queryGenerator = require("./queryGenerator"),
	quote = require("./util").quote,
	md5 = require("./util").md5;

var Collection = function(collectionName, fields, options) {
	this.options = _.defaults(options, {
		timestamps: false
	});

	this.kit = this.options.kit;
	this.adapter = this.options.adapter;
	this.options.tableName = collectionName;

	this.fields = {};
	this.dependencies = [];
	var pkFound = null;

	// iterate over attributes and normalize them
	_.forEach(fields, function(fieldProps, fieldName) {

		if (_.isString(fieldProps)) {
			if (!_.has(this.kit.types, fieldProps.toUpperCase())) {
				throw new Error("Unkown field type [" + fieldProps + "]");
			}

			fieldProps = {
				type: this.kit.types[fieldProps.toUpperCase()]
			};
		} else {
			fieldProps.type = this.kit.types[fieldProps.type.toUpperCase()]
		}

		if (_.has(fieldProps, "primary") && fieldProps.primary) {
			pkFound = fieldName;
		}

		this.fields[fieldName] = fieldProps;
	}, this);

	// add timestamp fields if necessary
	if (this.options.timestamps) {
		this.fields.createdAt = {
			type: this.kit.types.TIMESTAMP,
			service: true,
			default: "CURRENT_TIMESTAMP",
			readOnly: true
		};
		this.fields.updatedAt = {
			type: this.kit.types.TIMESTAMP,
			service: true,
			default: "CURRENT_TIMESTAMP",
			readOnly: true
		};
	}

	// add primary key fields if it was not found in attributes
	if (!pkFound) {
		this.fields.id = {
			type: this.kit.types.INT,
			primary: true,
			autoIncrement: true,
			service: true,
			readOnly: true
		};
		pkFound = "id";
	}

	this.primaryKey = pkFound;

	_.forEach(this.fields, function(fieldProps, fieldName) {
		fieldProps.readOnly = fieldProps.readOnly || false;
		fieldProps.hidden = fieldProps.hidden || false;
		fieldProps.service = fieldProps.service || false;
		fieldProps.optional = fieldProps.optional || false;
	}, this);
};

Collection.prototype.getDependencies = function() {
	return this.dependencies;
};

Collection.prototype.sync = function() {
	var executor = this.kit.executor({
		serial: true
	}),
	eventEmitter = new events.EventEmitter(),
	$this = this,
	r = queryGenerator.createTable(this.fields, {
		kit: this.kit,
		executor: executor,
		tableName: this.options.tableName
	});
	console.log(r.q);
	executor.query({
		text: r.q,
		name: "create_table_" + md5(r.q),
		values: r.v
	}).on("done", function() {
		eventEmitter.emit("done", $this, {
			queryData: r
		});
	}).on("error", function(err) {
		eventEmitter.emit("error", err);
	});

	return eventEmitter;
};

module.exports = Collection;