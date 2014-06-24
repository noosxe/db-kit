"use strict";

var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var path = require('path');
var _ = require('lodash');
var collectionsDir = path.join(__dirname, '../collections');
var MySQL = require('../../lib/adapters/mysql/index.js');

describe('MySQL adapter', function() {

	describe('#instance()', function() {

		it('should return an instance of MySQL', function() {

			expect(MySQL.instance())
				.to.be.an.instanceof(MySQL);

		});

		it('should return an instance of MySQL with default settings', function() {

			expect(MySQL.instance().options)
				.to.be.deep.equal({
					connection: {
						host: 'localhost',
						port: 3306,
						user: 'root',
						password: '',
						database: 'test',
						charset: 'UTF8_UNICODE_CI',
						string: 'mysql://root:@localhost:3306/test?&charset=UTF8_UNICODE_CI',
						debug: false
					}
				});

		});

		it('should return an instance of MySQL with provided settings', function() {

			expect(MySQL.instance({ connection: { user: 'test' }, collections: collectionsDir }).options)
				.to.be.deep.equal({
					connection: {
						host: 'localhost',
						port: 3306,
						user: 'test',
						password: '',
						database: 'test',
						charset: 'UTF8_UNICODE_CI',
						string: 'mysql://test:@localhost:3306/test?&charset=UTF8_UNICODE_CI',
						debug: false
					},
					collections: collectionsDir
				});

		});

	});

	describe('#loadCollections()', function() {

		it('should load collection definitions from specified location', function() {

			return expect(MySQL.instance({ collections: collectionsDir }).loadCollections().then(function(schema) {
				return schema.collections;
			})).to.eventually.have.keys(['User', 'Project']);

		});

	});

	describe('#prepareSchema()', function() {

		it('should convert collections to appropriate classes', function() {
			var my = MySQL.instance({ collections: collectionsDir });

			return expect(my.loadCollections().then(my.prepareSchema.bind(my)).then(function() {
				return my.schema.collections;
			})).to.eventually.have.keys(['User', 'Project']);

		});

		it('should generate connections', function() {

			var my = MySQL.instance({ collections: collectionsDir });

			return expect(my.loadCollections().then(my.prepareSchema.bind(my)).then(function() {
				return my.schema.connections;
			})).to.eventually.have.keys(['UserProject']);

		});

	});

});