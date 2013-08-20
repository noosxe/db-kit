var vows = require('vows'),
  assert = require('assert'),
       _ = require('underscore');

var Kit = require('../index.js');

var pgTypes = ['SMALLINT', 'INT', 'BIGINT', 'DEC', 'NUM', 'REAL', 'DOUBLE', 'SERIAL',
  'BIGSERIAL', 'MONEY', 'STRING', 'CHARS', 'TEXT', 'BYTEA', 'TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME', 'TIMETZ',
  'INTERVAL', 'BOOL', 'POINT', 'LINE', 'LSEG', 'BOX', 'PATH', 'POLYGON', 'CIRCLE', 'CIDR', 'INET', 'MACADDR'];

function typesShouldContain(types) {
  var context = {
    topic: function(tps) { return tps; }
  };

  _.each(types, function(v) {
    context['should contain ' + v] = function(topic) { assert.include(topic, v); };
  });

  return context;
}

vows.describe('kit').addBatch({
  'kit instance': {

    topic: function() {
      return new Kit('kit', 'postgres', '', {
        debug: true
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

    'config': {
      topic: function(kit) {
        return kit.config;
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
      },
      'should contain': typesShouldContain(pgTypes)
    },

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
        assert.equal(topic.getModelName(), 'user');
      },
      'table name is users': function(topic) {
        assert.equal(topic.getTableName(), 'users');
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
    }
  }
}).export(module);
