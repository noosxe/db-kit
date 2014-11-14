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

	describe('MySQL Collection instance', function() {

		describe('#delete()', function() {

			beforeEach(function() {
				return User.create().then(function() {
					return User.immediate();
				});
			});

			afterEach(function() {
				return User.destroy();
			});

			it('should delete object from the table', function() {
				return expect(User.find().then(function(results) {
					return results[0].delete().then(function() {
						return User.find();
					});
				})).to.eventually.have.length(0);
			});

		});

	});

});