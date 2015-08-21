var vows = require("vows"),
    assert = require("assert"),
    q = require("q");

console.log = function() { }
console.info = function() { }

vows.describe("Environment Tests").addBatch({
	"Make sure the 'properties' env variable" : {
    	topic: process.env.properties,
    	"is set": function(topic) {
    		assert.isNotNull(topic);
    	}
    },
    "Using property-manager": {
    	topic: require("./../lib/properties-manager"),
    	"Load the properties file": {
    		topic: function(manager) {
    			var self = this;
    			q.when(manager.getProperties())
    				.then(function (properties) {
    					self.callback(false, properties);
    				})
    				.catch(function(err) {
    					self.callback(err);
    				})
    		},
    		"and make sure it can be loaded": function(err, properties) {
    			assert.isNotNull(properties);
    			assert.isObject(properties);
    		}
    	}
    }
}).export(module);