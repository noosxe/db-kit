"use strict";

var fs                = require('fs');
var path              = require('path');
var dejavu            = require('dejavu');
var chai              = require('chai');
var chaiAsPromised    = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect            = chai.expect;
var Kit               = require('./../../index.js');

var conf = {
	dbuser: 'root',
	dbpass: '',
	dbname: 'test'
};

var cnfFile = path.join(__dirname, '/../.test.json');

if (fs.existsSync(cnfFile)) {
	conf = require(cnfFile);
}

var kit = Kit.instance({
	adapter: 'mysql',
	host: 'localhost',
	user: conf.dbuser,
	password: conf.dbpass,
	database: conf.dbname,
	collections: path.join(__dirname, '/../collections')
});

kit.setup().then(function() {
	var User = kit.schema.collections.User;
	var Project = kit.schema.collections.Project;

	describe('MySQL Collection instance', function() {

		describe('#save()', function() {

			beforeEach(function() {
				return User.create();
			});

			afterEach(function() {
				return User.destroy();
			});

			it('should save a single object', function() {
				var user = new User({ email: 'example@example.com' });

				return expect(user.save().then(function() {
					return kit.query('SELECT * FROM `User`');
				})).to.eventually.have.length(1);
			});

			it('should assign autoincrement id to saved object', function() {
				var user = new User({ email: 'example@example.com' });
				return expect(user.save().then(function() {
					return user.id;
				})).to.eventually.equal(1);
			});

		});

	});

});
