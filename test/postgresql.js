(function() {
  "use strict";

  var vows = require('vows')
    , assert = require('assert')
    , _ = require('lodash');

  var Kit = require('../index.js');
  var kit = new Kit('kit', 'postgres', {
    native: true//,
    //debug: true
  });

  var Car = null;
  var User = null;

  var suite = vows.describe('kit');
  suite.options.error = false;

  suite.addBatch({
    'Kit class': {
      topic: function() {
        return Kit;
      },

      'adapters': {
        topic: function(Kit) {
          return Kit.adapters;
        },

        'is object': function(topic) {
          assert.isObject(topic);
        },

        'includes postgres': function(topic) {
          assert.include(topic, 'POSTGRES');
          assert.isFunction(topic.postgres);
        }
      }
    }
  }).addBatch({
    'kit': {
      topic: function() {
        return kit;
      },

      'is kit object': function(topic) {
        assert.isObject(topic);
        assert.instanceOf(topic, Kit);
      },

      'options': {
        topic: function(kit) {
          return kit.options;
        },

        'is object': function(topic) {
          assert.isObject(topic);
        }
      },

      'configs': {
        topic: function(kit) {
          return kit.configs;
        },

        'is object': function(topic) {
          assert.isObject(topic);
        }
      },

      'types': {
        topic: function(kit) {
          return kit.types;
        },

        'is object': function(topic) {
          assert.isObject(topic);
        }
      },

      'adapter': {
        topic: function(kit) {
          return kit.adapter;
        },

        'is object': function(topic) {
          assert.isObject(topic);
        },

        'types': {
          topic: function(adapter) {
            return adapter.types;
          },

          'is object': function(topic) {
            assert.isObject(topic);
          }
        },

        'has methods': {
          topic: function(adapter) {
            return adapter;
          },

          'query': function(topic) {
            assert.isFunction(topic.query);
          },

          'begin': function(topic) {
            assert.isFunction(topic.begin);
          },

          'rollback': function(topic) {
            assert.isFunction(topic.rollback);
          },

          'commit': function(topic) {
            assert.isFunction(topic.commit);
          },

          'typeExists': function(topic) {
            assert.isFunction(topic.typeExists);
          },

          'defineModel': function(topic) {
            assert.isFunction(topic.defineModel);
          }
        }
      },

      'has methods': {
        topic: function(kit) {
          return kit;
        },

        'define': function(topic) {
          assert.isFunction(topic.define);
        },

        'isDefined': function(topic) {
          assert.isFunction(topic.isDefined);
        },

        'query': function(topic) {
          assert.isFunction(topic.query);
        },

        'begin': function(topic) {
          assert.isFunction(topic.begin);
        },

        'rollback': function(topic) {
          assert.isFunction(topic.rollback);
        },

        'commit': function(topic) {
          assert.isFunction(topic.commit);
        },

        'sync': function(topic) {
          assert.isFunction(topic.sync);
        }

      },

      'query': {
        topic: function(kit) {
          kit.query('SELECT NOW() AS "current_time"').on('done', this.callback);
        },

        'emits *done*': function(results, fields) {
          assert.isNotNull(results);
          assert.isNotNull(fields);
        },

        'returns result rows': function(results) {
          assert.isArray(results);
          assert.lengthOf(results, 1);
          assert.include(results[0], 'current_time');
        },

        'returns fields': function(results, fields) {
          assert.isArray(fields);
          assert.lengthOf(results, 1);
          assert.include(results[0], 'current_time');
        }
      },

      'wrong query': {
        topic: function(kit) {
          kit.query('this is not a query').on('error', this.callback);
        },

        'emits *error*': function(err) {
          assert.isNotNull(err);
        }
      }
    }
  }).addBatch({
    'kit model': {
      topic: function() {
        Car = kit.define('Car', {
          make: { type: kit.types.STRING, required: true },
          model: { type: kit.types.STRING, required: true },
          hp: { type: kit.types.INT, required: true },
          maxSpeed: { type: kit.types.INT, required: true },
          productionDate: { type: kit.types.DATE, required: true }
        }, {
          timestamps: true
        });

        User = kit.define('User', {
          email: { type: kit.types.STRING, required: true, unique: true, readOnly:true,
            match: /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,4}$/i },
          password: { type: kit.types.STRING, required: true, hidden: true, minLength: 8 },
          firstName: kit.types.STRING,
          lastName: kit.types.STRING,
          birthDate: { type: kit.types.DATE, required: true },
          gender: { type: kit.types.enum('gender', ['male', 'female']), required: true },
          phoneNumbers: { type: [kit.types.STRING] },
          car: { reference: Car }
        }, {
          timestamps: true
        });

        return User;
      },

      'is defined': function(topic) {
        assert.isNotNull(topic);
      },

      'has options defined': function(topic) {
        assert.include(topic, 'options');
      },

      'has attributes defined': function(topic) {
        assert.include(topic, 'attributes');
      },

      'has primary key': function(topic) {
        assert.include(topic, 'primaryKey');
      },

      'generates id primary key field': function(topic) {
        assert.include(topic.attributes, 'id');
        assert.include(topic.attributes.id, 'type');
        assert.equal(topic.attributes.id.type, 'serial');
        assert.include(topic.attributes.id, 'primary');
        assert.isTrue(topic.attributes.id.primary);
      },

      'generates timestamp fields': function(topic) {
        assert.include(topic.attributes, 'createdAt');
        assert.include(topic.attributes.createdAt, 'type');
        assert.equal(topic.attributes.createdAt.type, 'timestamp with time zone');
        assert.include(topic.attributes.createdAt, 'default');
        assert.equal(topic.attributes.createdAt.default, 'NOW()');

        assert.include(topic.attributes, 'updatedAt');
        assert.include(topic.attributes.updatedAt, 'type');
        assert.equal(topic.attributes.updatedAt.type, 'timestamp with time zone');
        assert.include(topic.attributes.updatedAt, 'default');
        assert.equal(topic.attributes.updatedAt.default, 'NOW()');
      },

      'has methods': {
        topic: function(topic) {
          return topic;
        },

        'sync': function(topic) {
          assert.isFunction(topic.sync);
        },

        'drop': function(topic) {
          assert.isFunction(topic.drop);
        },

        'build': function(topic) {
          assert.isFunction(topic.build);
        },

        'fromJson': function(topic) {
          assert.isFunction(topic.fromJson);
        },

        'find': function(topic) {
          assert.isFunction(topic.find);
        },

        'findOne': function(topic) {
          assert.isFunction(topic.findOne);
        },

        'update': function(topic) {
          assert.isFunction(topic.update);
        },

        'delete': function(topic) {
          assert.isFunction(topic.delete);
        }
      }
    }
  }).addBatch({
    'model sync method': {
      topic: function() {
        var $this = this;
        Car.sync().on('done', function() {
          User.sync().on('done', $this.callback);
        });
      },

      'returns model object': function(model) {
        assert.isObject(model);
        assert.include(model, 'options');
        assert.include(model.options, 'tableName');
        assert.equal(model.options.tableName, 'Users');
      },

      'creates table': {
        topic: function() {
          kit.query('SELECT * FROM "pg_tables" WHERE schemaname=\'public\' AND tablename=\'Users\'').on('done', this.callback);
        },

        'table found': function(results) {
          assert.isArray(results);
          assert.isNotNull(results[0]);
        }
      }
    }
  })/*.addBatch({
    'build method returns object which': {
      topic: function() {
        return User.build({
          email: 'kirlevon@gmail.com',
          password: 'pass',
          firstName: 'Levon',
          lastName: 'Kirakosyan',
          birthDate: new Date(1990, 8, 4),
          gender: 'male',
          phoneNumbers: ['9845642', '84512159'],
          car: {
            make: 'audi',
            model: 'TT',
            hp: 180,
            maxSpeed: 225,
            productionDate: new Date(2000, 0, 1)
          }
        });
      },

      'is not null': function(obj) {
        assert.isNotNull(obj);
      },

      'contains desired fields': function(obj) {
        assert.include(obj, '__kit');
        assert.include(obj, '__model');
        assert.include(obj, '__values');
        assert.include(obj, 'id');
        assert.include(obj, 'email');
        assert.include(obj, 'password');
        assert.include(obj, 'firstName');
        assert.include(obj, 'lastName');
        assert.include(obj, 'birthDate');
        assert.include(obj, 'gender');
        assert.include(obj, 'phoneNumbers');
        assert.include(obj, 'car');
        assert.include(obj, 'createdAt');
        assert.include(obj, 'updatedAt');
        assert.include(obj.car, '__kit');
        assert.include(obj.car, '__model');
        assert.include(obj.car, '__values');
        assert.include(obj.car, 'id');
        assert.include(obj.car, 'make');
        assert.include(obj.car, 'model');
        assert.include(obj.car, 'hp');
        assert.include(obj.car, 'maxSpeed');
        assert.include(obj.car, 'productionDate');
        assert.include(obj.car, 'createdAt');
        assert.include(obj.car, 'updatedAt');
      },

      'has methods': {
        topic: function(obj) {
          return obj;
        },

        'toJson': function(obj) {
          assert.isFunction(obj.toJson);
        },

        'save': function(obj) {
          assert.isFunction(obj.save);
        },

        'reload': function(obj) {
          assert.isFunction(obj.reload);
        },

        'delete': function(obj) {
          assert.isFunction(obj.delete);
        }
      },

      'save method': {
        topic: function(obj) {
          obj.save().on('done', this.callback);
        },

        'returns object': function(obj) {
          assert.isNotNull(obj);
        }
      }
    }
  })*/.addBatch({
    'model drop method': {
      topic: function() {
        User.drop().on('done', this.callback);
      },

      'returns model object': function(model) {
        assert.isObject(model);
        assert.include(model, 'options');
        assert.include(model.options, 'tableName');
        assert.equal(model.options.tableName, 'Users');
      },

      'deletes table': {
        topic: function() {
          kit.query('SELECT * FROM "pg_tables" WHERE schemaname=\'public\' AND tablename=\'Users\'').on('done', this.callback);
        },

        'table not found': function(results) {
          assert.isArray(results);
          assert.lengthOf(results, 0);
        }
      }
    }
  }).export(module);
}());
