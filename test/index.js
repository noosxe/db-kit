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

  var executor = kit.executor({ transaction: true });

  executor.query('SELECT NOW() AS "NOW"').on('done', function(rows, results) {
  }).on('error', function(err) {

  });

  executor.query('SELECT NOW() AS "THEN"').on('done', function(rows, results) {
    executor.finish();
  }).on('error', function(err) {

  });

/*
  var Car = kit.define('Car', {
    make: { type: kit.types.STRING, required: true },
    model: { type: kit.types.STRING, required: true },
    hp: { type: kit.types.INT, required: true },
    maxSpeed: { type: kit.types.INT, required: true },
    productionDate: { type: kit.types.DATE, required: true }
  }, {
    timestamps: true
  });*/

  //i(Car);

/*
  var User = kit.define('User', {
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

  var user = User.build({
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

  user.save().on('done', function(user) {
    console.log(user);
  });
  */

}());
