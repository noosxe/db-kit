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

	describe('#MySQL Collection', function() {

		describe('#create()', function() {

			beforeEach(function() {
				return kit.query('DROP TABLE IF EXISTS `User`');
			});

			afterEach(function() {
				return kit.query('DROP TABLE IF EXISTS `User`');
			});

			it('should create User table', function() {
				return expect(User.create().then(function() {
					return kit.query('SHOW TABLES LIKE "User"');
				})).to.eventually.have.length(1);
			});

		});

		describe('#destroy()', function() {

			beforeEach(function() {
				return User.create();
			});

			it('should drop the User table', function() {
				return expect(User.destroy().then(function() {
					return kit.query('SHOW TABLES LIKE "User"');
				})).to.eventually.have.length(0);
			});

		});

		describe('#empty()', function() {

			beforeEach(function() {
				return User.create().then(function() {
					return kit.query('INSERT INTO `User` (`email`) VALUES ("example@example.com")');
				});
			});

			it('should remove all the rows from the table', function() {
				return expect(User.empty().then(function() {
					return kit.query('SELECT * FROM `User`');
				})).to.eventually.have.length(0);
			});

		});

		describe('#find()', function() {

			beforeEach(function() {
				return User.create();
			});

			afterEach(function() {
				return User.destroy();
			});

			it('should return all rows if called without constraints', function() {
				return expect(kit.query('INSERT INTO `User` (`email`) VALUES ("example@example.com"), ("other@example.com")').then(function() {
					return User.find();
				})).to.eventually.have.length(2);
			});



		});

		describe('#findOne()', function() {

		});

		describe('#update()', function() {

		});

		describe('#getChildrenOf()', function() {

		});

		describe('#getDescendantsOf()', function() {

		});

	});

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

		});

		describe('#reload()', function() {

		});

		describe('#delete()', function() {

		});

	});

});