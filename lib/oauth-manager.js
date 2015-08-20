var oauthserver = require("oauth2-server");
var _ = require("lodash");
var q = require("q");

var SessionService = require("./services/auth/session-svc");

var grants = ["password", "refresh_token", "authorization_code"];

var oauth = oauthserver({
  model: {
  	getAccessToken: function(bearerToken, callback) {
      console.log("getAccessToken");
      q.when(oauth.SessionService.validate(bearerToken))
        .then(function(token) {
          var user = oauth.SessionService.getCurrentUser();
          var view = null;

          if (token) {
              view = { expires: token.expires, user: user }
          }

          callback(false, view);
        })
        .catch(function(err) {
          callback(err)
        });
  	},
  	getClient: function(clientId, clientSecret, callback) {
      console.log("getClient");
      q.when(oauth.SessionService.getClient(clientId, clientSecret))
        .then(function(client) {

          var view = null;
          if (client) {
            view = {
              clientId: client.name,
              redirectUri: client.redirects
            }
          }

          callback(false, view);
        })
        .catch(function(err) {
          callback(err)
        });
  	},
  	grantTypeAllowed: function(clientId, grantType, callback) {
      console.log("grantTypeAllowed");
      var client = oauth.SessionService.getCurrentClient();

      if (!client){
        callback(new Error("Client not set, cannot check grants!"));
      }
      else {
        callback(null, _.any(client.grants, _.matches(grantType)));
      }
  	},
  	saveAccessToken: function(accessToken, clientId, expires, user, callback) {
      console.log("saveAccessToken");
      q.when(oauth.SessionService.saveAccessToken(accessToken, expires))
        .then(function(user) {
          callback();
        })
        .catch(function(err) {
          callback(err)
        });
  	},
  	getUser: function(username, password, callback) {
      console.log("getUser");
      q.when(oauth.SessionService.authenticate(username, password))
        .then(function(user) {
          callback(false, user);
        })
        .catch(function(err) {
          callback(err)
        });
  	},
    saveRefreshToken: function(refreshToken, clientId, expires, user, callback) {
      console.log("saveRefreshToken");
      q.when(oauth.SessionService.saveRefreshToken(refreshToken, expires))
        .then(function(user) {
          callback();
        })
        .catch(function(err) {
          callback(err)
        });
    },
    getRefreshToken: function(refreshToken, callback) {
      console.log("getRefreshToken");
      q.when(oauth.SessionService.refresh(refreshToken))
        .then(function(token) {
          var client = oauth.SessionService.getCurrentClient();
          var user = oauth.SessionService.getCurrentUser();
          var view = null;

          if (token) {
              view = { clientId: client.name, expires: token.expires, userId: user._id }
          }

          callback(false, view);
        })
        .catch(function(err) {
          callback(err)
        });
    },
    revokeRefreshToken: function (refreshToken, callback) {
      console.log("revokeRefreshToken");
      q.when(oauth.SessionService.revoke(refreshToken))
        .then(function() {
          callback(false);
        })
        .catch(function(err) {
          callback(err)
        });
    },
    getAuthCode: function(authCode, callback) {
      console.log(authCode);
      callback(false, { clientId: "raincats", expires: new Date(), userId: "55c95a20208b2796265cc02d" });
      //callback(false, null);
    },
    saveAuthCode: function(authCode, clientId, expires, user, callback) {
      console.log("Save Auth Code", authCode, clientId, expires, user);
      callback(false);
    }
  },
  grants: grants
});

var oauthManager = {
  grant: function(req, res, next) {
    oauth.SessionService = new SessionService(req, res);
    oauth.grant()(req, res, next);
  },
  authorise: function(req, res, next) {
    oauth.SessionService = new SessionService(req, res);
    oauth.authorise()(req, res, next);
  },
  authCodeGrant: function(req, res, next) {
    oauth.SessionService = new SessionService(req, res);
    oauth.authCodeGrant(function(req, callback) {

      req.res.redirect("/logs?" + req.originalUrl);
      return;

      console.log(oauth.SessionService.getCurrentUser());

      callback(false, null, null);
    })(req, res, next);
  }
};

console.info("OAuth Manager initialized");
module.exports = oauthManager
