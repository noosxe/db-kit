var async = require('async');

module.exports = (function() {
  "use strict";

  var Executor = function(options) {
    options = options || {};
    var tasks = this.tasks = [];
    var running = false;
    var client = null;
    var done = null;
    var finish = false;

    var $this = this;

    this.callback = function() {
      $this.runTasks();
    };

    this.runTasks = function() {
      var task = tasks.shift();

      if (task) {
        running = true;
        task($this.callback, client);
      } else if (options.inTransaction && client) {
        options.kit.commit(client, done);
      }
    };

    this.addTask = function(task) {
      $this.tasks.push(task);

      if (!running) {
        if (options.inTransaction && !client) {
          options.kit.begin().on('done', function(client, done) {
            $this.client = client;
            $this.done = done;

          });
        } else {
          $this.runTasks();
        }
      }
    };

    this.finish = function() {
      if (!options.inTransaction) {
        return;
      }

      if (client) {
        if (running) {
          finish = true;
        } else {
          options.kit.commit(client, done);
        }
      }
    };
  };

  return Executor;

}());
