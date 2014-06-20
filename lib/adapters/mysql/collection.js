"use strict";

var dejavu = require('dejavu');

var Collection = dejavu.AbstractClass.declare({

	$name: 'Collection',

	_fields: {},
	_options: {},
	_values: {},

	initialize: function() {

	},

	$statics: {
		create: function() {

		},

		destroy: function() {

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