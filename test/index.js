(function () {
  "use strict";

  var util = require('util');
  var Kit = require('../index.js');
  var kit = new Kit('kit', 'postgres', '', {
      debug: true
  });

  var Server = kit.define('server', {
    model: {
      type: kit.types.STRING,
      required: true
    },
    memory: {
      type: kit.types.INT,
      required: true
    },
    storage: {
      type: kit.types.INT,
      required: true
    }
  });

  var Office = kit.define('office', {
    address: {
      type: kit.types.STRING,
      required: true,
      readOnly: true
    },
    rooms: {
      type: kit.types.INT,
      required: true
    },
    employees: {
      type: kit.types.INT,
      required: true
    },
    server: {
      type: kit.types.INT,
      required: true,
      reference: {
        entity: Server,
        field: 'id'
      }
    }
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
    },
    office: {
      type: kit.types.INT,
      required: true,
      reference: {
        entity: Office,
        field: 'id'
      }
    }
  });

  var project = Project.build({
    name: 'Big Project',
    author: {
      email: 'manager@toort.net',
      password: 'password',
      firstName: 'Manager',
      lastName: 'Toort'
    },
    office: {
      address: 'Street 153, building 82',
      rooms: 10,
      employees: 500,
      server: {
        model: 'cloud',
        memory: 15000,
        storage: 80000
      }
    }
  });

//  kit.sync(function() {

//    project.save(function(err, id) {

      Project.find({ join:['author', 'office', 'office.server'], order:['project.name ASC'] }, function(err, projects) {
        if (!err && projects.length > 0) {
          console.log(projects[0].toString());
          console.log(projects[1].toString());
        }
      });

//    });

//  });

}());
