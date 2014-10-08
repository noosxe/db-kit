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

		it('should have #getFields() method', function() {

			expect(User).itself.to.respondTo('getFields');

		});

		it('should have #getCollectionName() method', function() {

			expect(User).itself.to.respondTo('getCollectionName');

		});

		it('should have #getTableName() method', function() {

			expect(User).itself.to.respondTo('getTableName');

		});

		it('should have #getPrimaryKey() method', function() {

			expect(User).itself.to.respondTo('getPrimaryKey');

		});

		it('should have #getDependencies() method', function() {

			expect(User).itself.to.respondTo('getDependencies');

		});

		it('should have #sync() method', function() {

			expect(User).itself.to.respondTo('sync');

		});

		it('should have #create() method', function() {

			expect(User).itself.to.respondTo('create');

		});

		it('should have #destroy() method', function() {

			expect(User).itself.to.respondTo('destroy');

		});

		it('should have #empty() method', function() {

			expect(User).itself.to.respondTo('empty');

		});

		it('should have #find() method', function() {

			expect(User).itself.to.respondTo('find');

		});

		it('should have #findOne() method', function() {

			expect(User).itself.to.respondTo('find');

		});

		it('should have #update() method', function() {

			expect(User).itself.to.respondTo('update');

		});

		it('should have #getChildrenOf() method', function() {

			expect(User).itself.to.respondTo('getChildrenOf');

		});

		it('should have #getDescendantsOf() method', function() {

			expect(User).itself.to.respondTo('getDescendantsOf');

		});

		it('should have #getLinkedTo() method', function() {

			expect(User).itself.to.respondTo('getLinkedTo');

		});

	});

	describe('MySQL Collection instance', function() {

		it('should have #getCollectionName() method', function() {

			expect(User).to.respondTo('getCollectionName');

		});

		it('should have #getValues() method', function() {

			expect(User).to.respondTo('getValues');

		});

		it('should have #isDirty() method', function() {

			expect(User).to.respondTo('isDirty');

		});

		it('should have #toJSON() method', function() {

			expect(User).to.respondTo('toJSON');

		});

		it('should have #toJSONString() method', function() {

			expect(User).to.respondTo('toJSONString');

		});

		it('should have #save() method', function() {

			expect(User).to.respondTo('save');

		});

		it('should have #reload() method', function() {

			expect(User).to.respondTo('reload');

		});

		it('should have #delete() method', function() {

			expect(User).to.respondTo('delete');

		});

		it('should have #onAfterLoad() method', function() {

			expect(User).to.respondTo('onAfterLoad');

		});

		it('should have #onBeforeSave() method', function() {

			expect(User).to.respondTo('onBeforeSave');

		});

		it('should have #onAfterSave() method', function() {

			expect(User).to.respondTo('onAfterSave');

		});

		it('should have #onAfterSave() method', function() {

			expect(User).to.respondTo('onAfterSave');

		});

	});

});
