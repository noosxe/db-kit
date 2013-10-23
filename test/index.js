(function () {
  "use strict";

  var util = require('util');
  var Kit = require('../index.js');
  var kit = new Kit({
    connString: 'postgres://postgres:@localhost:5432/kit',
    debug: true
  });

  var User = kit.define('user', {
    email: { type: kit.types.STRING, required: true, unique: true },
    password: { type: kit.types.STRING, required: true },
    firstName: { type: kit.types.STRING },
    lastName: { type: kit.types.STRING }
  }, {
    tableName: 'users'
  });

  var UserPhoto = kit.define('userPhoto', {
    user: { type: kit.types.INT, required: true, reference: { entity: User, field: 'id' } },
    url: { type: kit.types.STRING, required: true }
  }, {
    tableName: 'userPhotos'
  });

  User.addOptions({ beforeDelete: { deleteReferringFrom: { entity: UserPhoto, field: 'user' } } });

  kit.sync(function() {

  });

}());
