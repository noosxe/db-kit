(function() {
    "use strict";

    module.exports = {
        POSTGRES: 'postgres',
        postgres: function() { return require('./adapters/pg/adapter'); }
    };

})();
