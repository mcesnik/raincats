var _ = require("lodash");
var q = require("q");
var express = require("express");
var bodyParser = require("body-parser");

var PropertiesManager = require("./properties-manager");
var OAuthManager = require("./oauth-manager");

var expressManager =  {
  init: function() {
    var deferred = q.defer();

    q.when(PropertiesManager.getProperties())
      .then(function(properties) {
        if (!properties || !properties.web) {
          deferred.reject(new Error("Cannot find property section 'web' which is required."))
        }
        else if (!properties.web.port) {
          deferred.reject(new Error("Property 'web.port' is missing and is required."));
        }
        else {
          var app = express();

          app.use(bodyParser.json());
          app.use(bodyParser.urlencoded({
            extended: true
          }));

          app.use(function(req, res, next) {
            var src = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var method = req.method;
            var url = req.url;

            console.info("%s %s %s", src, method, url);

            next();
          })

          app.all('/oauth/token', OAuthManager.grant);
          app.all('/oauth/auth', OAuthManager.authorise, OAuthManager.authCodeGrant);

          app.use("/users", OAuthManager.authorise, require("./routes/users"));
          app.use("/user", OAuthManager.authorise, require("./routes/user"));

          //app.use("/posts", require("./routes/posts"));
          //app.use("/post", require("./routes/post"));

          // Error Handler (should be smarter..?)
          app.use(function (err, req, res, next) {

            if (err.name === "OAuth2Error")	{

              if (err.code == 500 || err.code == 503) {
                console.error("Could not authenticate!", err, err.stack);
              }

              delete err.name;
              delete err.message;
              delete err.stack;

              if (err.headers) {
                res.set(err.headers);
                delete err.headers;
              }

              res.status(err.code).send(err.error_description);
              return;
            }

            console.error(err, err.stack);
            res.status(500).send(err);
          });

          var host = properties.web.host;
          var port = properties.web.port;

          app.listen(port, host);
          deferred.resolve((host || "localhost") + ":" + port);
        }
      })
      .catch(function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  }
};

console.info("Express Manager initialized");
module.exports = expressManager;
