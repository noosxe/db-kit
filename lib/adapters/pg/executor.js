(function() {
  "use strict";

  var events = require('events')
    , util = require('util')
    , _ = require('lodash');

  var Executor = function(options) {
    events.EventEmitter.call(this);
    this.options = _.defaults(options, {
      serial: false,
      transaction: false
    });
    this.queryInterface = options.queryInterface;
    this.tasks = [];
    this.state = 'idle';
    var $this = this;
    this.on('connected', function() {
      $this.step();
    });
    this.on('stepDone', function() {
      $this.connect();
    });
    this.on('error', function(err) {

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

    this.queryInterface.query(task.queryObject, this.client).on('done', function(results) {
      if ($this.options.serial || $this.options.transaction) {
        if ($this.done) {
          $this.done();
        }
      }
      task.emitter.emit('done', results.rows, results);
      $this.emit('stepDone');
    }).on('error', function(err) {
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
      if ($this.options.serial || $this.options.transaction) {
        $this.client = client;
        $this.done = done;
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
