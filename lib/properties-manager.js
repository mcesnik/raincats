var q = require("q");
var props = require("properties");

var properties = null;

var propertiesManager = {
  getProperties: function() {

    if (properties != null) {
      return q.when(properties);
    }
    else {
      var deferred = q.defer();

      props.parse(process.env.properties || "project.properties", { path: true, sections: true }, function(err, properties_) {
      	if (err) {
      		deferred.reject(err);
      	}
      	else {
          properties = properties_;
          deferred.resolve(properties);
        }
      });

      return deferred.promise;
    }
  }
}

console.info("Properties Manager initialized");
module.exports = propertiesManager;
