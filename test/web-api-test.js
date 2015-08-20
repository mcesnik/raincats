var vows = require("vows"),
    assert = require("assert"),
    _ = require("lodash"),
    q = require("q");

var consoleStamp = require('console-stamp')(console, 'HH:MM:ss.l');   

console.log = function() { }
console.info = function() { }

vows.describe("Testing the RainCats API").addBatch({
    "Check for the 'properties' env variable" : {
    	topic: process.env.properties,
    	"and make sure its set": function(topic) {
    		assert.isNotNull(topic);
    	},
    	"is set for testing": function(topic) {
    		assert.equal(topic, "test.properties");
    	}
    },
    "Using the property manager": {
    	topic: require("./../lib/properties-manager"),
    	"load some properties": {
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
    		"and make sure they loaded": function(err, properties) {
    			assert.isNotNull(properties);
    			assert.isObject(properties);
    		}
    	}
    },
    "Using the MongoDB manager": {
    	topic: require("./../lib/mongodb-manager"),
    	"try to connect to the test db": {
    		topic: function(manager) {
    			var self = this;
    			q.when(manager.connect())
    				.then(function(url) {
    					self.callback(false, url);
    				})
    				.catch(function(err) {
    					self.callback(err);
    				})
    		},
    		"and double check just to be sure": function(err, url) {
    			assert.isNotNull(url);
    			assert.isString(url);
    			assert.match(url, /.*raincats-test/);
    		}
    	},
    }
}).addBatch({
	"Using the MongoDB manager": {
    	topic: require("./../lib/mongodb-manager").disconnect(),
    	"disconnect from the test db": function() {
				assert.isTrue(true);
			}
    	},
}).export(module);

/*
var q = require("q");


var PropertiesManager = require("./../lib/properties-manager");
var MongoDBManager = require("./../lib/mongodb-manager");
var ExpressManager = require("./../lib/express-manager");


q.when(PropertiesManager.getProperties())
	.then(function(properties) {

		if (!properties.debug) {
			console.log = function() { }
		}

		q.when(MongoDBManager.connect())
			.then(function(mongo) {
				console.info("MongoDB connected (%s)", mongo);
				q.when(ExpressManager.init())
					.then(function(express) {
						console.info("Web-API initialized (%s)", express);

            			test.run();
					})
					.catch(function(err) {
						console.error("Failed to initialize express, application terminating..", err, err.stack);
					});
			})
			.catch(function(err) {
				console.error("Failed to connect to MongoDB, application terminating..", err, err.stack);
			});
	})
	.catch(function(err) {
		console.error("Failed to load properties, application terminating..", err, err.stack);
	});
*/