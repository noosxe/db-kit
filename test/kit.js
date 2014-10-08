"use strict";

var chai = require('chai');
var chaiFuzzy = require('chai-fuzzy');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiFuzzy);
chai.use(chaiAsPromised);
var expect = chai.expect;
var Kit = require('../lib/kit.js');
var MySQL = require('../lib/adapters/mysql/index.js');
var path = require('path');
var _ = require('lodash');

describe('Kit', function() {

	it('should have #instance() method', function() {

		expect(Kit).itself.to.respondTo('instance');

	});

	describe('#instance()', function() {

		it('should return an instance of Kit', function() {

			expect(Kit.instance())
				.to.be.an.instanceof(Kit);

		});

		it('should accept configuration options', function() {

			expect(Kit.instance({
				adapter: 'mysql',
				host: 'localhost',
				user: 'root',
				password: '',
				database: 'test',
				collections: path.join(__dirname, 'collections')
			}).options)
				.to.be.like({
					adapter: 'mysql',
					debug: false,
					collections: path.join(__dirname, 'collections'),
					connection: {
						host: 'localhost',
						user: 'root',
						password: '',
						database: 'test',
						port: undefined,
						charset: "UTF8_UNICODE_CI",
						debug: false
					}
				});

		});

		it('should set up the appropriate adapter', function() {

			expect(Kit.instance({
				adapter: 'mysql',
				host: 'localhost',
				user: 'root',
				password: '',
				database: 'test',
				collections: path.join(__dirname, 'collections')
			}).adapter)
				.to.be.an.instanceof(MySQL);

		});

		it('should read collection definitions and setup schema', function() {

			var kit = Kit.instance({
				adapter: 'mysql',
				host: 'localhost',
				user: 'root',
				password: '',
				database: 'test',
				collections: path.join(__dirname, 'collections')
			});

			expect(kit.setup().then(function() {
				return _.keys(kit.schema.collections);
			})).to.eventually.be.deep.equal(['User', 'Project']);

		});

	});

	describe('Instance', function() {

		var kit = Kit.instance();

		it('should have #setup() method', function() {

			expect(kit).to.respondTo('setup');

		});

		it('should have #query() method', function() {

			expect(kit).to.respondTo('query');

		});

		it('should have #sync() method', function() {

			expect(kit).to.respondTo('sync');

		});

	});

});