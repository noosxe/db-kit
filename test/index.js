(function() {
  "use strict";

  var Kit = require('../index.js');

  var kit = new Kit({
    connString: 'postgres://postgres:@localhost:5432/kit',
    native: true,
    debug: true
  });

  var User = kit.define('User', {
    email: { type: kit.types.STRING, required: true, unique: true },
    password: { type: kit.types.STRING, required: true },
    firstName: kit.types.STRING,
    lastName: kit.types.STRING,
    birthDate: { type: kit.types.DATE, required: true },
    gender: { type: kit.types.enum('gender', ['male', 'female']), required: true }
  }, {
    timestamps: true
  });

  User.sync().on('done', function(model) {
    console.log(model);
  });

}());
