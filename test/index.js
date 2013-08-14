(function () {
  "use strict";

  var Kit = require('../index.js');
  var kit = new Kit('kit', 'postgres', '', {
      debug: true
  });

  var User = kit.define('user', {
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
    lastName: kit.types.STRING
  });

  var Project = kit.define('project', {
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
/*
  var user = User.build({
    email: 'levon@toort.net',
    password: 'bacon',
    firstName: 'Levon',
    lastName: 'Kirakosyan'
  });
*/
  var otherUser = User.build({
    email: 'human@example.com',
    password: 'paaass'
  });

  console.log(otherUser);

/*
  otherUser.save(function(err, id) {
    console.log(id);
  });
*/
//  kit.sync();
/*
  user.save(function(err, id) {
    console.log(id);
  });
*/

//  User.find({}, function(err, users) {
//    console.log(users);
//  });

}());
