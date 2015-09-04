var q = require("q");
var _ = require("lodash");
var validator = require("validator");

var EncryptionManager = require("./../../encryption-manager");
var Client = require("./../../models/auth/client");
var User = require("./../../models/auth/user");

var SessionService = function(req, res) {

  if (!res.locals.auth) {
    res.locals.auth = {
      client: null,
      user: null
    }
  }

  this.auth = res.locals.auth;
}

/* Tries to look-up a client with the given id.
 *
 * @param clientId - the name of the client
 * @param clientSecret - the secret for the client (not required for auth code)
 */
SessionService.prototype.getClient = function(clientId, clientSecret) {
  var deferred = q.defer();

  var self = this;
  self.auth.client = null;

  Client.findOne({ name: clientId }, function(err, client) {
    if (err) {
      console.error("Failed to look-up client: %s.", clientId);
      deferred.reject(err);
    }
    else if (!client) {
      deferred.reject(false);
    }
    else if (clientSecret == null && _.any(client.grants, "authorization_code")) {
      self.auth.client = client;
      deferred.resolve(client); // oauth2-server asks for the client differently
    }
    else {
      q.when(EncryptionManager.verify(client.secret, clientSecret))
        .then(function(res) {
          if (!res) {
            deferred.reject(false);
          }
          else {
            self.auth.client = client;
            deferred.resolve(client);
          }
        })
        .catch(function(err) {
          deferred.reject(err);
        });
    }
  });

  return deferred.promise;
}

/* Gets the current user
 */
SessionService.prototype.getCurrentClient = function() {
  return this.auth.client;
}

/* Attempts to authenticate a user
 *
 * @param username - the user's e-mail
 * @param passwd - the user's password
 * @param callback - the callback called when
 * @returns {promise<object>}
 */
SessionService.prototype.authenticate = function(username, password) {
  var deferred = q.defer();

  var self = this;
  self.auth.user = null;

  User.findOne({ email: username }, function(err, user) {
    if (err) {
      console.error("Failed to look-up user: %s.", username);
      deferred.reject(err);
    }
    else if (!user) {
      deferred.reject(false);
    }
    else {
      q.when(EncryptionManager.verify(user.password, password))
        .then(function(res) {
          if (!res) {
            deferred.reject(false);
          }
          else {
            self.auth.user = user;
            deferred.resolve(user);
          }
        })
        .catch(function(err) {
          deferred.reject(err);
        });
    }
  });

  return deferred.promise;
}

/* Attempts to save the current users access token
 *
 * @param accessToken - the access token
 * @param expires - the expiry (optional)
 * @returns {promise<object>}
 */
SessionService.prototype.saveAccessToken = function(accessToken, expires) {
  var deferred = q.defer();

  var client = this.auth.client;
  var user = this.auth.user;

  var saveUser = function() {
    if (!user.accessTokens) {
      user.accessTokens = [];
    }

    user.accessTokens.push({
      token: accessToken,
      clientId: client._id,
      expires: expires
    });

    user.save(function(err) {

      if (err) {
        console.error("Failed to save access token: %s.", accessToken);
        deferred.reject(err);
      }
      else {
        deferred.resolve();
      }
    });
  }

  if (!user.save) {
    User.findById(user.id, function(err, u) {
      if (err || u == null) {
        console.error("Failed to save access token: %s, could not look-up user: %s.", accessToken, user.id);
        deferred.reject(err);
      }
      else {
        user = u;
        saveUser();
      }
    })
  }
  else {
    saveUser();
  }

  return deferred.promise;
}

/* Attempts to validate the access token
 *
 * @param accessToken - the access token
 * @returns {promise<object>}
 */
SessionService.prototype.validate = function(accessToken) {
  var deferred = q.defer();

  var self = this;
  self.auth.client = null;
  self.auth.user = null;

  User.findOne({ "accessTokens.token": accessToken }, function(err, user) {
    if (err) {
      console.error("Failed to look-up access token: %s.", accessToken);
      deferred.reject(err);
    }
    else if (!user) {
      deferred.reject(false);
    }
    else {
      var token = _.find(user.accessTokens, { token: accessToken });
      var expires = _.result(token, "expires");

      if (validator.isBefore(expires)) {
        user.accessTokens.pull(token._id);

        user.save(function(err) {
          if (err) {
            console.error("Failed to remove expired access token: %s.", accessToken);
            deferred.reject(err);
          }
          else {
            deferred.reject(false);
          }
        });
      }
      else {
        Client.findById(token.clientId, function(err, client) {
          if (err) {
            console.error("Failed to look-up access token: %s, client %s cannot be found.", accessToken, token.clientId);
            deferred.reject(false);
          }
          else {
            if (!token.clientId.equals(client._id)) {
              deferred.reject(false);
            }
            else {
              self.auth.client = client;
              self.auth.user = user;
              deferred.resolve(token);
            }
          }
        });
      }
    }
  });

  return deferred.promise;
}

/* Attempts to save the current users refresh token
 *
 * @param refreshToken - the refresh token
 * @param expires - the expiry (optional)
 * @returns {promise<object>}
 */
SessionService.prototype.saveRefreshToken = function(refreshToken, expires) {
  var deferred = q.defer();

  var client = this.auth.client;
  var user = this.auth.user;

  var saveUser = function() {
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }

    user.refreshTokens.push({
      token: refreshToken,
      clientId: client._id,
      expires: expires
    });

    user.save(function(err) {

      if (err) {
        console.error("Failed to save refresh token: %s.", refreshToken);
        deferred.reject(err);
      }
      else {
        deferred.resolve();
      }
    });
  }

  if (!user.save) {
    User.findById(user.id, function(err, u) {
      user = u;
      saveUser();
    })
  }
  else {
    saveUser();
  }

  return deferred.promise;
}

/* Attempts to refresh the access token
 *
 * @param refreshToken - the refresh token
 * @returns {promise<object>}
 */
SessionService.prototype.refresh = function(refreshToken) {
  var deferred = q.defer();

  var self = this;
  var client = self.auth.client;
  self.auth.user = null;

  User.findOne({ "refreshTokens.token": refreshToken }, function(err, user) {

    if (err) {
      console.error("Failed to look-up refresh token: %s.", refreshToken);
      deferred.reject(err);
    }
    else if (!user) {
      deferred.reject(false);
    }
    else {

      var token = _.find(user.refreshTokens, { token: refreshToken });
      var expires = _.result(token, "expires");

      if (token.clientId.equals(client._id)) {
        // Remove this refresh token as its no longer going to be valid
        // user.refreshTokens.pull(token._id);

        user.save(function(err) {
          if (err) {
            console.error("Failed to remove expired refresh token: %s.", refreshToken);
            deferred.reject(err);
          }
          else if (validator.isBefore(expires)) {
            deferred.reject(false);
          }
          else {
            self.auth.user = user;
            deferred.resolve(token);
          }
        });
      }
      else {
        deferred.reject(false);
      }
    }
  });

  return deferred.promise;
}

/* Attempts to revoke the refresh token
 *
 * @param refreshToken - the refresh token
 * @returns {promise<object>}
 */
SessionService.prototype.revoke = function(refreshToken) {
  var deferred = q.defer();

  User.findOne({ "refreshTokens.token": refreshToken }, function(err, user) {

    if (err) {
      console.error("Failed to look-up refresh token: %s.", refreshToken);
      deferred.reject(err);
    }
    else if (!user) {
      deferred.reject(false);
    }
    else {
      var token = _.find(user.refreshTokens, { token: refreshToken });
      user.refreshTokens.pull(token._id);

      user.save(function(err) {
        if (err) {
          console.error("Failed to revoke refresh token: %s.", refreshToken);
          deferred.reject(err);
        }
        else {
          deferred.resolve();
        }
      });
    }
  });

  return deferred.promise;
}

/* Gets the current user (shortcut for req.user)
 */
SessionService.prototype.getCurrentUser = function() {
  return this.auth.user;
}

console.info("Session Service initialized");
module.exports = SessionService;
