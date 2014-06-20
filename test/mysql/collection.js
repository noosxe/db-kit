"use strict";

var chai = require('chai');
var expect = chai.expect;
var CollectionFactory = require('../../lib/adapters/mysql/collectionFactory.js');
var Collection = require('../../lib/adapters/mysql/collection.js');

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
});

var user = new User({
	email: 'example@example.com',
	password: 'secret',
	serial: 'abcdefg'
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