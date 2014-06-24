"use strict";

var dejavu = require('dejavu');
var _ = require('lodash');

var Collection = dejavu.AbstractClass.declare({

	$name: 'Collection',
	$locked: false,

	_fields: {},
	_options: {},
	_values: {},

	$statics: {
		create: function() {

		},

		destroy: function() {

		},

		find: function() {

		},

		findOne: function() {

		},

		update: function() {

		}
	},

	$finals: {
		save: function() {

		},

		reload: function() {

		},

		delete: function() {

		}
	}
});

module.exports = Collection;