"use strict";

var chai = require('chai');
var expect = chai.expect;
var CollectionFactory = require('../../lib/adapters/mysql/collectionFactory.js');
var Collection = require('../../lib/adapters/mysql/collection.js');

var col = CollectionFactory.build({
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

describe('MySQL.CollectionFactory', function() {

	describe('#build()', function() {

		it('should build collection class based on provided definition', function() {
			expect(col).to.have.property('create');
			expect(col).to.have.property('destroy');
			expect(col).to.have.property('find');
			expect(col).to.have.property('findOne');
			expect(col).to.have.property('update');
		});

	});

});