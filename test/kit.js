"use strict";

var chai = require('chai');
var chaifuzzy = require('chai-fuzzy');
chai.use(chaifuzzy);
var expect = chai.expect;
var Kit = require('../lib/kit.js');
var MySQL = require('../lib/adapters/mysql/index.js');

describe('Kit', function() {

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
				database: 'test'
			}).options)
				.to.be.like({
					adapter: 'mysql',
					debug: false,
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
				database: 'test'
			}).adapter)
				.to.be.an.instanceof(MySQL);

		});

	});

});