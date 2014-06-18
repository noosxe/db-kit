"use strict";

var chai = require('chai');
var expect = chai.expect;
var CollectionFactory = require('../../lib/adapters/mysql/collectionFactory.js');

describe('MySQL.CollectionFactory', function() {

	describe('#build()', function() {

		it('should build collection class based on provided definition', function() {

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
					}
				},
				options: {
					timestamps: true,
					collectionName: 'User'
				},
				primaryKeys: 'id'
			});
		})

	});

});