"use strict";

var chai              = require('chai');
var chaiAsPromised    = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect            = chai.expect;
var CollectionFactory = require('../../lib/adapters/mysql/collectionFactory.js');
var Collection        = require('../../lib/adapters/mysql/collection.js');
var Connection        = require('db-kit.connection-mysql');

var User = CollectionFactory.build({
	fields: {
		email: {
			type: 'STRING',
			primary: false,
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
	primaryKeys: 'id'
}, {
	connection: Connection.instance({
		host: 'localhost',
		port: 3306,
		user: 'root',
		password: '',
		database: 'test',
		charset: 'UTF8_UNICODE_CI',
		debug: false,
		string: 'mysql://root:@localhost:3306/test?&charset=UTF8_UNICODE_CI'
	})
});

var user = new User({
	email: 'example@example.com',
	password: 'secret',
	serial: 'abcdefg'
});

describe('MySQL Collection', function() {

	describe('#create()', function() {

		it('should create collection table', function() {
			return expect(User.create()).to.eventually.not.be.undefined;
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

});