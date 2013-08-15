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
  var project = Project.build({
    name: 'Other Project',
    author: {
      email: 'admin@toort.net',
      password: 'password',
      firstName: 'Admin',
      lastName: 'Toort'
    }
  });

  project.save(function(err, id) {

  });
*/


  Project.find({ limit:1, offset:1 }, function(err, projects) {
    console.log(projects[0].toString());
  });

}());
