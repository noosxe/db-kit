(function() {
  "use strict";

  var vows = require('vows')
    , assert = require('assert')
    , _ = require('lodash');

  var Kit = require('../index.js');

  var suite = vows.describe('kit');
  suite.options.error = false;

  suite.addBatch({
    'Kit class': {
      'adapters': {
        topic: function() {
          return Kit.adapters;
        },

        'is object': function(topic) {
          assert.isObject(topic);
        },

        'contains': {
          topic: function() {
            return Kit.adapters;
          },

          'postgres': function(topic) {
            assert.include(topic, 'postgres');
          }
        }
      }
    },

    'kit': {
      topic: function() {
        return new Kit('kit', 'postgres', {
          native: true
        });
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
          return kit;
        },

        'emits *error*': function(kit) {
          assert.throws(function() { kit.query.on('error', function() {}); }, Error);
        }
      },

      'model': {
        topic: function(kit) {
          var Car = kit.define('Car', {
            make: { type: kit.types.STRING, required: true },
            model: { type: kit.types.STRING, required: true },
            hp: { type: kit.types.INT, required: true },
            maxSpeed: { type: kit.types.INT, required: true },
            productionDate: { type: kit.types.DATE, required: true }
          }, {
            timestamps: true
          });

          return kit.define('User', {
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
        },

        'is defined': function(model) {
          assert.isNotNull(model);
        },

        'has options defined': function(model) {
          assert.include(model, 'options');
        },

        'has attributes defined': function(model) {
          assert.include(model, 'attributes');
        },

        'has primary key': function(model) {
          assert.include(model, 'primaryKey');
        },

        'generates id primary key field': function(model) {
          assert.include(model.attributes, 'id');
          assert.include(model.attributes.id, 'type');
          assert.equal(model.attributes.id.type, 'serial');
          assert.include(model.attributes.id, 'primary');
          assert.isTrue(model.attributes.id.primary);
        },

        'generates timestamp fields': function(model) {
          assert.include(model.attributes, 'createdAt');
          assert.include(model.attributes.createdAt, 'type');
          assert.equal(model.attributes.createdAt.type, 'timestamp with time zone');
          assert.include(model.attributes.createdAt, 'default');
          assert.equal(model.attributes.createdAt.default, 'NOW()');

          assert.include(model.attributes, 'updatedAt');
          assert.include(model.attributes.updatedAt, 'type');
          assert.equal(model.attributes.updatedAt.type, 'timestamp with time zone');
          assert.include(model.attributes.updatedAt, 'default');
          assert.equal(model.attributes.updatedAt.default, 'NOW()');
        },

        'has methods': {
          topic: function(model) {
            return model;
          },

          'sync': function(model) {
            assert.isFunction(model.sync);
          },

          'drop': function(model) {
            assert.isFunction(model.drop);
          },

          'build': function(model) {
            assert.isFunction(model.build);
          },

          'fromJson': function(model) {
            assert.isFunction(model.fromJson);
          },

          'find': function(model) {
            assert.isFunction(model.find);
          },

          'findOne': function(model) {
            assert.isFunction(model.findOne);
          },

          'update': function(model) {
            assert.isFunction(model.update);
          },

          'delete': function(model) {
            assert.isFunction(model.delete);
          }
        },

        'sync method': {
          topic: function(model, kit) {
            var $this = this;
            kit.models.Car.sync().on('done', function() {
              model.sync().on('done', $this.callback);
            });
          },

          'returns model object': function(model) {
            assert.isObject(model);
            assert.include(model, 'options');
            assert.include(model.options, 'tableName');
            assert.equal(model.options.tableName, 'Users');
          },

          'creates table': {
            topic: function(arg0, arg1, arg2, kit) {
              kit.query('SELECT * FROM "pg_tables" WHERE schemaname=\'public\' AND tablename=\'Users\'').on('done', this.callback);
            },

            'table found': function(results) {
              assert.isArray(results);
              assert.isNotNull(results[0]);
            },

            'drop method': {
              topic: function(arg0, arg1, model) {
                model.drop().on('done', this.callback);
              },

              'returns model object': function(model) {
                assert.isObject(model);
                assert.include(model, 'options');
                assert.include(model.options, 'tableName');
                assert.equal(model.options.tableName, 'Users');
              },

              'deletes table': {
                topic: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, kit) {
                  kit.query('SELECT * FROM "pg_tables" WHERE schemaname=\'public\' AND tablename=\'Users\'').on('done', this.callback);
                },

                'table not found': function(results) {
                  assert.isArray(results);
                  assert.lengthOf(results, 0);
                }
              }
            }
          }
        },

        'build method returned object': {
          topic: function(model) {
            return model.build({
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

          'calling save': {
            topic: function(obj) {
              obj.save().on('done', this.callback);
            },

            'returns object': function(obj) {
              console.log(obj);
            }
          }
        }
      }
/*,
      'model': {
        topic: function(kit) {
          return kit.define('user', {
            email: {
              type: kit.types.STRING,
              required: true,
              readOnly: true,
              unique: true
            },
            password: {
              type: kit.types.STRING,
              required: true,
              hidden: true
            },
            firstName: kit.types.STRING,
            lastName: kit.types.STRING,
            birthDate: kit.types.DATE
          });
        },
        'model name is user': function(topic) {
          assert.equal(topic.name, 'user');
        },
        'table name is user': function(topic) {
          assert.equal(topic.getTableName(), 'user');
        },
        'returns field names': function(topic) {
          var fieldNames = topic.getFieldNames();
          assert.include(fieldNames, 'email');
          assert.include(fieldNames, 'password');
          assert.include(fieldNames, 'firstName');
          assert.include(fieldNames, 'lastName');
        },
        'has fields': function(topic) {
          assert.isTrue(topic.hasField('email'));
          assert.isTrue(topic.hasField('password'));
          assert.isTrue(topic.hasField('firstName'));
          assert.isTrue(topic.hasField('lastName'));
        },
        'required fields': function(topic) {
          assert.isTrue(topic.isRequired('email'));
          assert.isTrue(topic.isRequired('password'));
          assert.isFalse(topic.isRequired('firstName'));
          assert.isFalse(topic.isRequired('lastName'));
        },
        'unique fields': function(topic) {
          assert.isTrue(topic.isUnique('email'));
          assert.isFalse(topic.isUnique('password'));
          assert.isFalse(topic.isUnique('firstName'));
          assert.isFalse(topic.isUnique('lastName'));
        },
        'readOnly fields': function(topic) {
          assert.isTrue(topic.isReadOnly('email'));
          assert.isFalse(topic.isReadOnly('password'));
          assert.isFalse(topic.isReadOnly('firstName'));
          assert.isFalse(topic.isReadOnly('lastName'));
        },
        'hidden fields': function(topic) {
          assert.isTrue(topic.isHidden('password'));
          assert.isFalse(topic.isHidden('email'));
          assert.isFalse(topic.isHidden('firstName'));
          assert.isFalse(topic.isHidden('lastName'));
        },
        'field types': function(topic) {
          assert.equal(topic.fieldType('email'), topic.getOptions().kit.types.STRING);
          assert.equal(topic.fieldType('password'), topic.getOptions().kit.types.STRING);
          assert.equal(topic.fieldType('firstName'), topic.getOptions().kit.types.STRING);
          assert.equal(topic.fieldType('lastName'), topic.getOptions().kit.types.STRING);
          assert.equal(topic.fieldType('birthDate'), topic.getOptions().kit.types.DATE);
        },

        'reference': {
          topic: function(User, kit) {
            return kit.define('project', {
              name: {
                type: kit.types.STRING,
                required: true
              },
              author: {
                type: kit.types.INT,
                required: true,
                reference: {
                  entity: User,
                  field: 'id'
                },
                readOnly:true
              }
            });
          },

          'is reference': function(topic) {
            assert.isTrue(topic.isReference('author'));
          },
          'reference is defined': function(topic) {
            assert.isNotNull(topic.getReference('author'));
          },
          'has one dependency - *User*': function(topic) {
            var deps = topic.getDependencies();
            assert.isArray(deps);
            assert.lengthOf(deps, 1);
            assert.equal(deps[0].getModelName(), 'user');
          }
        }
      } */
    }
  }).export(module);

}());
