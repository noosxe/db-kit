(function() {
  "use strict";

  var events = require('events')
    , util = require('util')
    , _ = require('lodash')
    , uuid = require('node-uuid');

  var Executor = function(options) {
    events.EventEmitter.call(this);
    this.instance = uuid.v4();
    this.options = _.defaults(options, {
      serial: false,
      transaction: false
    });
    this.queryInterface = options.queryInterface;
    this.tasks = [];
    this.state = 'idle';
    this.client = null;
    this.done = null;
    var $this = this;
    this.on('connected', function() {
      $this.step();
    });
    this.on('stepDone', function() {
      $this.connect();
    });
    this.on('error', function(err) {
      console.log(err);
    });
  };

  util.inherits(Executor, events.EventEmitter);

  Executor.prototype.query = function(queryObject) {
    var eventEmitter = new events.EventEmitter();
    this.tasks.push({ queryObject: queryObject, emitter: eventEmitter });
    if (this.state === 'idle') {
      this.state = 'working';
      this.connect();
    }
    return eventEmitter;
  };

  Executor.prototype.step = function() {
    var task = this.tasks.shift()
      , $this = this;

    if (!task) {
      this.state = 'idle';
      this.emit('drain');
      return;
    }

    if (this.options.kit.options.debug) {
      if (_.isObject(task.queryObject)) {
        console.log('\n===================');
        console.log('running query:');
        console.log("\t", task.queryObject.text);
        console.log('with values:');
        console.log("\t", task.queryObject.values);
        console.log('===================\n');
      } else {
        console.log('\n===================');
        console.log('running query:');
        console.log("\t", task.queryObject);
      }
    }

    this.queryInterface.query(task.queryObject, this.client).on('done', function(results) {
      if (!$this.options.transaction) {
        if ($this.done) {
          $this.done();
        }
        $this.client = null;
        $this.done = null;
      }
      task.emitter.emit('done', results.rows, results.fields, results);
      $this.emit('stepDone');
    }).on('error', function(err) {
      if ($this.options.kit.options.debug) {
        console.log(err);
      }

      if ($this.options.transaction) {
        $this.queryInterface.rollback($this.client).on('done', function() {
          $this.done(err);
          task.emitter.emit('error', err);
          $this.emit('error', err);
        }).on('error', function(err) {
          $this.done(err);
          task.emitter.emit('error', err);
          $this.emit('error', err);
        });
      } else {
        $this.done(err);
        task.emitter.emit('error', err);
        $this.emit('error', err);
      }
    });
  };

  Executor.prototype.connect = function() {
    if (this.client) {
      this.emit('connected');
      return;
    }

    var options = this.options.kit.options
      , configs = this.options.kit.configs
      , $this = this;

    this.queryInterface.connect({
      native: options.native,
      connString: configs.connString,
      username: configs.username,
      password: configs.password,
      host: configs.host,
      port: configs.port,
      database: configs.database
    }).on('done', function(client, done) {
      $this.client = client;
      $this.done = done;
      if ($this.options.transaction) {
        $this.queryInterface.begin(client).on('done', function() {
          $this.emit('connected');
        }).on('error', function(err) {
          $this.emit('error', err);
        });
      } else {
        $this.emit('connected');
      }
    }).on('error', function(err) {
      $this.emit('error', err);
    });
  };

  Executor.prototype.finish = function() {
    var $this = this;

    if (this.options.transaction) {
      this.queryInterface.commit(this.client).on('done', function() {
        if ($this.done) {
          $this.done();
        }
        $this.tasks = [];
        $this.client = null;
        $this.done = null;
      }).on('error', function(err) {
        $this.emit('error', err);
      });
    } else {
      if (this.done) {
        this.done();
      }
      this.tasks = [];
      this.client = null;
      this.done = null;
    }
  };

  module.exports = Executor;
}());
