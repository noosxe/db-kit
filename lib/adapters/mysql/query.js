"use strict";

var mysql			= require("mysql2")
	, events		= require("events")
	, _					= require("lodash")
	, pool      = null;

var Query = function() {

};

Query.prototype.run = function(queryObject, options) {
	var eventEmitter = new events.EventEmitter()
		, $this = this;

	this.connect({
		connString: options.kit.configs.connString,
		username: options.kit.configs.username,
		password: options.kit.configs.password,
		host: options.kit.configs.host,
		port: options.kit.configs.port,
		database: options.kit.configs.database
	}).on("done", function(client, done) {
		if (options.kit.options.debug) {
			if (_.isObject(queryObject)) {
				console.log("\n===================");
				console.log("running query:");
				console.log("\t", queryObject.text);
				console.log("with values:");
				console.log("\t", queryObject.values);
				console.log("===================\n");
			} else {
				console.log("\n===================");
				console.log("running query:");
				console.log("\t", queryObject);
			}
		}
		$this.query(queryObject, client).on("done", function(results) {
			done();
			eventEmitter.emit("done", results.rows, results.fields, results);
		}).on("error", function(err) {
			done(err);
			eventEmitter.emit("error", err);
		});
	}).on("error", function(err) {
		if (options.kit.options.debug) {
			console.log(err);
		}
		eventEmitter.emit("error", err);
	});

	return eventEmitter;
};

Query.prototype.query = function(queryObject, client) {
	var eventEmitter = new events.EventEmitter();
	var rows = [];
	var results = {};
	var error = false;
	var q = null;

	if (_.isObject(queryObject)) {
		q = client.execute(queryObject.text, queryObject.values);
	} else {
		q = client.query(queryObject);
	}

	q.on('fields', function(fields) {
		results.fields = fields;
	}).on("result", function(row) {
		rows.push(row);
	}).on("end", function() {
		if (!error) {
			results.rows = rows;
			eventEmitter.emit("done", results);
		}
	}).on("error", function(err) {
		error = true;
		eventEmitter.emit("error", err);
	});

	return eventEmitter;
};

Query.prototype.connect = function(connOptions) {
	var connString = connOptions.connString || (
		"mysql://" + connOptions.username
			+ ":" + connOptions.password
			+ "@" + connOptions.host
			+ ":" + connOptions.port
			+ "/" + connOptions.database)
		, eventEmitter = new events.EventEmitter();

	process.nextTick(function() {
		if (pool == null) {
			pool = mysql.createPool(connString);
		}

		pool.getConnection(function(err, connection) {
			if (err) {
				eventEmitter.emit("error", err);
			} else {
				eventEmitter.emit("done", connection, function() {
					connection.release();
				});
			}
		});
	});

	return eventEmitter;
};

module.exports = new Query();