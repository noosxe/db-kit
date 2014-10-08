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

	describe('#MySQL Collection', function() {

		describe('#findOne()', function() {

			beforeEach(function() {
				return User.create();
			});

			afterEach(function() {
				return User.destroy();
			});

			it('should return single rows if called without constraints', function() {
				return expect(kit.query('INSERT INTO `User` (`email`) VALUES ("example@example.com"), ("other@example.com")').then(function() {
					return User.findOne();
				})).to.eventually.not.be.null;
			});

			it('should return null if table is empty', function() {
				return expect(User.findOne()).to.eventually.be.null;
			});

		});

	});
});
