"use strict";

var chai              = require('chai');
var chaiAsPromised    = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect            = chai.expect;
var CollectionFactory = require('../../lib/adapters/mysql/collectionFactory.js');
var Collection        = require('../../lib/adapters/mysql/collection.js');
var Connection        = require('db-kit.connection-mysql');
var connection        = Connection.instance({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: '',
	database: 'test',
	charset: 'UTF8_UNICODE_CI',
	debug: false,
	string: 'mysql://root:@localhost:3306/test?&charset=UTF8_UNICODE_CI'
});

var User = CollectionFactory.build({
	fields: {
		email: {
			type: 'STRING',
			primary: true,
			autoIncrement: false,
			optional: false,
			readOnly: false,
			hidden: false,
			service: false
		},
		password: {
			type: 'STRING',
			length: 50,
			primary: false,
			autoIncrement: false,
			optional: false,
			readOnly: false,
			hidden: false,
			service: false
		},
		serial: {
			type: 'STRING',
			primary: false,
			autoIncrement: false,
			optional: false,
			readOnly: true,
			hidden: false,
			service: false
		}
	},
	options: {
		timestamps: true,
		collectionName: 'User'
	},
	primaryKey: 'email'
}, {
	connection: connection
});

var user = new User({
	email: 'example@example.com',
	password: 'secret',
	serial: 'abcdefg'
});

describe('MySQL Collection', function() {

	describe('#create()', function() {

		beforeEach(function() {
			return connection.query('DROP TABLE IF EXISTS `User`');
		});

		afterEach(function() {
			return connection.query('DROP TABLE IF EXISTS `User`');
		});

		it('should create collection table', function() {
			return expect(User.create().then(function() {
				return connection.query('SELECT * FROM information_schema.tables WHERE table_schema = "test" AND table_name = "User" LIMIT 1');
			})).to.eventually.have.length(1);
		});

	});

	describe('#destroy()', function() {

		beforeEach(function() {
			return User.create();
		});

		afterEach(function() {
			return connection.query('DROP TABLE IF EXISTS `User`');
		});

		it('should destroy collection table', function() {
			return expect(User.destroy().then(function() {
				return connection.query('SELECT * FROM information_schema.tables WHERE table_schema = "test" AND table_name = "User" LIMIT 1');
			})).to.eventually.have.length(0);
		});

	});

	describe('#empty()', function() {

		beforeEach(function() {
			return User.create().then(function() {
				return connection.query('INSERT INTO `User` (`email`, `password`, `serial`) VALUES ("example@example.com", "secret", "abcdefg") ');
			});
		});

		afterEach(function() {
			return User.destroy();
		});

		it('should truncate the collection table', function() {
			return expect(User.empty().then(function() {
				return connection.query('SELECT * FROM `User`');
			})).to.eventually.have.length(0);
		});

	});

});

describe('MySQL Collection instance', function() {

	it('should have required field properties', function() {

		expect(user).to.have.property('email');
		expect(user).to.have.property('password');
		expect(user).to.have.property('serial');

	});

	it('should throw exception when trying to set readOnly property', function() {

		var action = function() {
			user.serial = 'test';
		};

		expect(action).to.throw(Error);

	});

	describe('#save()', function() {

		beforeEach(function() {
			return User.create();
		});

		afterEach(function() {
			return User.destroy();
		});

		it('should save the object', function() {

			return expect(user.save().then(function() {
				return connection.query('SELECT * FROM `User`');
			})).to.eventually.be.deep.equal([
					{
						email: 'example@example.com',
						password: 'secret',
						serial: 'abcdefg'
					}
				]);

		});

	});

});