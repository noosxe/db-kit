(function () {
  "use strict";

  var Kit = require('../index.js');
  var kit = new Kit('kit', 'postgres', '', {
      debug: true
  });

  var Test = kit.define('test', {
    email: {
      type: kit.types.STRING
    },
    password: {
      type: kit.types.STRING
    },
    firstName: kit.types.STRING,
    lastName: kit.types.STRING
  });

  var t = Test.build();

  console.log(Test);
  console.log(t);

}());
