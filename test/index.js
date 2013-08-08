(function () {
  "use strict";

  var Kit = require('../index.js');
  var kit = new Kit('kit', 'postgres', '', {
      debug: true
  });

  var User = kit.define('user', {
    email: {
      type: kit.types.STRING,
      null: false,
      readOnly: true,
      unique: true
    },
    password: {
      type: kit.types.STRING,
      null: false
    },
    firstName: kit.types.STRING,
    lastName: kit.types.STRING
  });

  var Project = kit.define('project', {
    name: {
      type: kit.types.STRING,
      null: false
    },
    author: {
      type: kit.types.INT,
      null: false,
      reference: {
        entity: User,
        field: 'id'
      },
      readOnly:true
    }
  });

  var project = Project.build({
    name: 'My project',
    author: {
      email: 'levon@toort.net',
      password: 'bacon'
    }
  });

  kit.sync(function() {

  });

}());
