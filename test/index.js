(function () {
  "use strict";

  var Kit = require('../index.js');
  var kit = new Kit('kit', 'postgres', '', {
      debug: true
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
    name: 'Other Project',
    author: {
      email: 'admin@toort.net',
      password: 'password',
      firstName: 'Admin',
      lastName: 'Toort'
    },
    office: {
      address: 'Street 3, building 2',
      rooms: 2,
      employees: 15
    }
  });

  console.log(project.toString());
/*
  project.save(function(err, id) {

     Project.find({ join:['author'], limit:1 }, function(err, projects) {
     console.log(projects[0].toString());
     console.log(projects[0].author.toString());
     });

  });
*/

}());
