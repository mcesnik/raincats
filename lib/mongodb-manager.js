var _ = require("lodash");
var q = require("q");
var mongoose = require("mongoose");

var PropertiesManager = require("./properties-manager");


var mongoDbManager = {
  connect: function() {
    var deferred = q.defer();

    q.when(PropertiesManager.getProperties())
      .then(function(properties) {

        if (!properties || !properties.db) {
          deferred.reject(new Error("Cannot find property section 'db' which is required."))
        }
        else if (!properties.db.host || _.trim(properties.db.host).length == 0) {
          deferred.reject(new Error("Property 'db.host' is missing and is required."));
        }
        else if (!properties.db.schema || _.trim(properties.db.schema).length == 0) {
          deferred.reject(new Error("Property 'db.schema' is missing and is required."));
        }
        else {
          var url = "mongodb://" + properties.db.host + "/" + properties.db.schema

          var opts = {
            server: { poolSize: properties.db.poolsize || 1 }
          };

          mongoose.connect(url, opts, function(err) {
            if (err) {
              deferred.reject(err);
            }
            else {
              deferred.resolve(mongoose.connections[0]);
            }
          });
        }
      })
      .catch(function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  },
  drop: function() {

    var deferred = q.defer();

    q.when(PropertiesManager.getProperties())
      .then(function(properties) {

        if (!properties || !properties.db) {
          deferred.reject(new Error("Cannot find property section 'db' which is required."))
        }
        else if (!properties.db.host || _.trim(properties.db.host).length == 0) {
          deferred.reject(new Error("Property 'db.host' is missing and is required."));
        }
        else if (!properties.db.schema || _.trim(properties.db.schema).length == 0) {
          deferred.reject(new Error("Property 'db.schema' is missing and is required."));
        }
        else if (!mongoose.connection || !mongoose.connection.readyState) {
          deferred.reject(new Error("Must be connected to MongoDB to drop the current schema."));
        }
        else {

          mongoose.connection.db.dropDatabase(function(err, result) {
            if (err) {
              deferred.reject(err);
            }
            else {
              deferred.resolve("mongodb://" + properties.db.host + "/" + properties.db.schema);
            }
          });
        }
      })
      .catch(function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  },
  processErrors: function(err) {
    var code = 200;
    var errors = [];

    if (err.name === "ValidationError") {
      code = 400; // Bad request

      _.forEach(err.errors, function(value, key) {
        errors.push({ message: value.message });
      });
    }
    else if (err.name === "MongoError") {

      _.forEach(err.writeErrors || [], function(value, key) {

        if (err.code === 11000) {
          code = code !== 200 ? 400 : code; // only update code if its 200

          var msg = value.errmsg.substring(34);
          var field = _.last(msg.substring(0, msg.indexOf(" ")).split(".")); //$field_x
          errors.push({ message: _.capitalize(field.substring(1, field.lastIndexOf("_"))) + " must be unique." })
        }
        else {
          code = 500;
          errors.push({ message: value.errmsg });
        }
      });

      _.forEach(err.readErrors || [], function(value, key) {
        code = 500;
        errors.push({ message: value.errmsg });
      });
    }

    return {
      code: code,
      errors: errors
    }
  }
};

console.info("MongoDB Manager initialized");
module.exports = mongoDbManager;
