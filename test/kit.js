"use strict";

var expect = require('chai').expect;
var Kit = require('../lib/kit.js');

describe('Kit', function() {

	describe('#instance()', function() {

		it('should return an instance of Kit', function() {

			expect(Kit.instance())
				.to.be.an.instanceof(Kit);

		});

	});

});