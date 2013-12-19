(function() {
  "use strict";

  var util = require('util')
    , i = function(obj) {
        console.log(util.inspect(obj, { showHidden: true, depth: null, colors: true }));
      };

  //require('./postgresql').kit.run();

  var Kit = require('../index.js');
  var kit = new Kit('kit', 'postgres', {
    native: true,
    debug: true
  });

  var Project = kit.define('Project', {
    make: { type: kit.types.STRING, required: true },
    model: { type: kit.types.STRING, required: true },
    hp: { type: kit.types.INT, required: true },
    maxSpeed: { type: kit.types.INT, required: true },
    productionDate: { type: kit.types.DATE, required: true }
  }, {
    timestamps: true
  });

  var Worker = kit.define('Worker', {
    email: { type: kit.types.STRING, required: true, unique: true, readOnly: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/ },
    password: { type: kit.types.STRING, required: true, hidden: true, minLength: 8 },
    firstName: kit.types.STRING,
    lastName: kit.types.STRING,
    birthDate: { type: kit.types.DATE, required: true },
    gender: { type: kit.types.enum('gender', ['male', 'female']), required: true },
    phoneNumbers: { type: [kit.types.STRING] }
  }, {
    timestamps: true
  });

  Project.as('projects').field('id').manyToMany(Worker.as('workers'));

  kit.sync().on('done', function() {
    console.log('synced');
  });

}());
