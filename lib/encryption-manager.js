var _ = require("lodash");
var q = require("q");
var ee = require("easy-encryption");
var bcrypt = require("bcrypt");

var PropertiesManager = require("./properties-manager")

var encryptionManager = {
  encrypt: function(secret) {
    var deferred = q.defer();

    q.when(PropertiesManager.getProperties())
      .then(function(properties) {

        if (!properties || !properties.encryption) {
          deferred.reject(new Error("Cannot find property section 'encryption' which is required."))
        }
        if (!properties.encryption.secret || _.trim(properties.encryption.secret).length == 0) {
          deferred.reject(new Error("Property 'encryption.secret' is missing and is required."));
        }
        else if (!secret || _.trim(secret).length == 0) {
          deferred.reject(new Error("Cannot encrypt an empty string."));
        }
        else {
          try {
            var encrypted = ee.encrypt(properties.encryption.secret, secret);
            deferred.resolve(encrypted);
          }
          catch (err) {
            console.error("Failed to encrypt secret.  Unexpected error.")
            deferred.reject(err);
          }
        }
      })
      .catch(function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  },
  decrypt: function(cipher) {
    var deferred = q.defer();

    q.when(PropertiesManager.getProperties())
      .then(function(properties) {

        if (!properties || !properties.encryption) {
          deferred.reject(new Error("Cannot find property section 'encryption' which is required."))
        }
        if (!properties.encryption.secret || _.trim(properties.encryption.secret).length == 0) {
          deferred.reject(new Error("Property 'encryption.secret' is missing and is required."));
        }
        else if (!cipher || _.trim(cipher).length == 0) {
          deferred.reject(new Error("Cannot decrypt an empty cipher."));
        }
        else {
          try {
            var decrypted = ee.decrypt(properties.encryption.secret, cipher);
            deferred.resolve(decrypted);
          }
          catch (err) {
            console.error("Failed to decrypt secret.  Unexpected error (possible secret mismatch?).")
            deferred.reject(err);
          }
        }
      })
      .catch(function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  },
  hash: function(secret) {
    var deferred = q.defer();

    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        deferred.reject(err);
      }
      else {
        bcrypt.hash(secret, salt, function(err, hash) {
          if (err) {
            deferred.reject(err);
          }
          else {
            deferred.resolve(hash);
          }
        });
      }
    })

    return deferred.promise;
  },
  verify: function(hash, secret) {
    var deferred = q.defer();

    bcrypt.compare(secret, hash, function(err, res) {
      if (err) {
        deferred.reject(err);
      }
      else {
        deferred.resolve(res);
      }
    })

    return deferred.promise;
  }
};

console.info("Encryption Manager initialized");
module.exports = encryptionManager;
