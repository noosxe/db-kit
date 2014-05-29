"use strict";

var expect = require("chai").expect;
var path = require('path');
var schemasDir = path.join(__dirname, "schemas");
var Kit = require("../index.js");

var kit = new Kit({
	adapter: Kit.adapters.POSTGRES,
	connString: "postgres://postgres:@localhost:5432/test"
});

describe("kit - postgresql", function() {
	describe("kit", function() {
		describe("#query()", function() {
			it("should execute raw query with parameters", function(done) {
				kit.query({ text: "SELECT $1::int + $2::int AS result", values: [4, 5] }).on('error', function(err) {
				}).on('done', function(result) {
					expect(result).to.be.a("array");
					expect(result).to.have.length(1);
					expect(result[0]).to.be.a("object");
					expect(result[0]).to.have.ownProperty("result");
					expect(result[0].result).to.be.equal(9);
					done();
				});
			});
		});
	});
});