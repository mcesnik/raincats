var vows = require("vows"),
    assert = require("assert"),
    _ = require("lodash"),
    q = require("q");

var consoleStamp = require('console-stamp')(console, 'HH:MM:ss.l');

console.log = function() { }
console.info = function() { }

vows.describe("Testing the RainCats API Managers").addBatch({
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
    				.then(function(connection) {
              connection.close();
    					self.callback(false, connection.name);
    				})
    				.catch(function(err) {
    					self.callback(err);
    				})
    		},
    		"and double check just to be sure": function(err, schema) {
    			assert.isNotNull(schema);
    			assert.isString(schema);
    			assert.equal(schema, "raincats-test");
    		}
    	}
    },
    "Using the Express manager": {
      topic: require("./../lib/express-manager"),
      "try to initalize express": {
        topic: function(manager) {
          var self = this;
          q.when(manager.init())
            .then(function(express) {
              self.callback(false, express);
            })
            .catch(function(err) {
              self.callback(err);
            })
        },
        "and verify its listening": function(err, express) {

          assert.isTrue(true);
          express.close();
        }
      }
    },
    "Using the Encryption manager": {
      topic: require("./../lib/encryption-manager"),
      "try to encrypt a password": {
        topic: function(manager) {
          var self = this;
          q.when(manager.encrypt("testing"))
            .then(function(cipher) {
              self.callback(false, cipher)
            })
            .catch(function(err) {
              self.callback(err);
            })
        },
        "and make sure it worked": function(err, cipher) {
          assert.isNotNull(cipher);
          assert.isString(cipher);
        },
        "and then decrypt it": {
          topic: function(cipher, manager) {
              var self = this;
              q.when(manager.decrypt(cipher))
                .then(function(secret) {
                  self.callback(false, secret);
                })
                .catch(function(err) {
                  self.callback(err);
                })
          },
          "back to its original": function(err, secret) {
            assert.equal(secret, "testing");
          }
        }
      }
    }
}).export(module);
