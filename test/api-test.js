var vows = require("vows"),
    assert = require("assert"),
    q = require("q");

console.log = function() { }
console.info = function() { }

vows.describe("API Tests").addBatch({
  "Using mongodb-manager": {
    topic: require("./../lib/mongodb-manager"),
    "try to connect to the db.": {
      topic: function(mongo) {
        var self = this;

        q.when(mongo.connect())
          .then(function(db_connection) {
            self.callback(false, db_connection);
          })
          .catch(function(err) {
            self.callback(err);
          })

      },
      "Using the express-manager": {
        topic: require("./../lib/express-manager"),
        "start the web server.": {
          topic: function(mongo, db_connection, express) {
            var self = this;

            q.when(express.init())
              .then(function(server) {
                self.callback(false, server);
              })
              .catch(function(err) {
                self.callback(err);
              })
          },
          "Using an http client": {
            topic: require("http"),
            "try to get an access token": {
              topic: function() {
                console.error(arguments);
                this.callback(false);
              },
              "and verify": function(topic) {
                console.error(topic);
                assert.isTrue(true);
              }
            }
          }
        }
      }
    }
  }
}).export(module);
