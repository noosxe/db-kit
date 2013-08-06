(function () {
    "use strict";

    var Kit = require('../index.js');
    var kit = new Kit('kit', 'postgres', '', {
        debug: true
    });

    console.log(kit);
}());
