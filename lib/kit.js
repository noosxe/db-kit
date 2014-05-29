"use strict";

var _ = require("lodash")
	, async = require("async")
	, adapters = require("./adapters")
	, events = require("events")
	, EventEmitter = events.EventEmitter
	, util = require("util")
	, fs = require("fs")
	, path = require("path")
	, yaml = require('js-yaml');

var Kit = function (database, username, password, options) {

	var self = this;

	if (_.isObject(database)) {
		options = database;
	} else if (_.isObject(password)) {
		options = password;
		password = '';
	}

	self.options = _.defaults(options || {}, {
		adapter: adapters.POSTGRES,
		host: "localhost",
		native: false,
		debug: false
	});

	var Adapter = adapters[self.options.adapter]();
	self.adapter = new Adapter(self);

	self.configs = {
		host: self.options.host,
		port: self.options.port || self.adapter.port,
		database: database,
		username: username,
		password: password || '',
		connString: self.options.connString || null
	};

	if (self.options.collectionsDir != undefined) {
		process.nextTick(function() {
			fs.readdir(self.options.collectionsDir, function(err, files) {
				async.each(files, function(file, done) {
					if (file.match(/\.yml$/i)) {
						var filePath = path.join(self.options.collectionsDir, file);
						fs.readFile(filePath, 'utf8', function(err, data) {
							var collectionDef = yaml.safeLoad(data) || {};
							_.forEach(collectionDef, function(ob, name) {
								if (ob.type == "collection") {
									self.define(name, ob.fields, ob.options);
								}
							});
							done();
						});
						return;
					}

					done();
				}, function(err) {
					self.emit("ready", self);
				});
			});
		});
	} else {
		process.nextTick(function() {
			self.emit("ready", self);
		});
	}
};

util.inherits(Kit, EventEmitter);

Kit.prototype.collections = {};

Kit.prototype.__defineGetter__("types", function() {
	return this.adapter.types;
});

Kit.__defineGetter__("adapters", function() {
	return adapters;
});

Kit.prototype.define = function(collectionName, fields, options) {
	this.collections[collectionName] = this.adapter.defineCollection(collectionName, fields, options);
	return this.collections[collectionName];
};

Kit.prototype.query = function(queryObject, options) {
	return this.adapter.query(queryObject, options);
};

Kit.prototype.executor = function(options) {
	return this.adapter.executor(options);
};

Kit.prototype.begin = function(client) {
	return this.adapter.begin.apply(this.adapter, arguments);
};

Kit.prototype.rollback = function(client) {
	return this.adapter.rollback.apply(this.adapter, arguments);
};

Kit.prototype.commit = function(client) {
	return this.adapter.commit.apply(this.adapter, arguments);
};

Kit.prototype.sync = function() {
	var resolved = []
		, collections = _.toArray(this.collections)
		, eventEmitter = new events.EventEmitter();

	var resolver = function(node) {
		var deps = node.getDependencies();

		_.each(deps, function(value) {
			if (resolved.indexOf(value) === -1) {
				resolver(value);
			}
		});

		resolved.push(node);
	};

	_.each(collections, function(value) {
		if (resolved.indexOf(value) === -1) {
			resolver(value);
		}
	});

	async.mapSeries(resolved, function(item, fn) {
		item.sync().on("done", function(collection) {
			fn(null, collection);
		}).on("error", function(err) {
			fn(err);
		});
	}, function(err) {
		if (err) {
			eventEmitter.emit("error", err);
		} else {
			eventEmitter.emit("done");
		}
	});

	return eventEmitter;
};

module.exports = Kit;