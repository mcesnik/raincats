var q = require("q");
var _ = require("lodash");
var validator = require("validator");
var mongoose = require("mongoose");

var EncryptionManager = require("./../../encryption-manager");
var MongoDBManager = require("./../../mongodb-manager");
var SessionService = require("./session-svc");
var User = require("./../../models/auth/user");

var UserService = function(req, res) {
  this.$sessionSvc = new SessionService(req, res);
}

/* Converts a MongoDB model to a user view
 *
 * @param {model} - A MongoDB user
 * @returns object
 */
var toView = function(model) {
  if (model) {
    return {
      id: model._id,
      name: model.name,
      email: model.email,
      sms: model.sms
    };
  }

  return null;
};

/* Validates the model based on the mode (add/edit)
 *
 * @param {model} - The MongoDB model
 * @param mode - The validation mode (add or edit)
 * @returns [errors<string>]
 */
var validate = function(model, mode) {

  var errors = [];

  if (validator.isNull(model.name)) {
    errors.push("Name is required.");
  }

  if (validator.isNull(model.email)) {
    errors.push("Email is required.");
  }
  else if (!validator.isEmail(model.email, { allow_utf8_local_part: false })) {
    errors.push("Email is not valid.  Must be in the format your_name@your_email.com.");
  }

  if (!validator.isNull(model.sms) && !validator.isMobilePhone(model.sms, "en-US")) {
    errors.push("SMS is not valid. Must be between 10 and 13 digits.");
  }

  if (validator.equals(mode, "add") && validator.isNull(model.password)) {
    errors.push("Password is required.");
  }
  else {
    if (model.password.length < 6) {
      errors.push("Password must be at least 6 characters.");
    }

    if (!validator.matches(model.password, "[A-Z]")) {
      errors.push("Password must contain at least 1 uppercase letter.");
    }

    if (!validator.matches(model.password, "[a-z]")) {
      errors.push("Password must contain at least 1 lowercase letter.");
    }

    if (!validator.matches(model.password, "[0-9]")) {
      errors.push("Password must contain at least 1 digit.");
    }

    var symbolPattern = /[!]|[@]|[#]|[$]|[%]|[\^]|[&]|[*]|[(]|[)]|[{]|[}]|[\[]|[\]]|[;]|[:]|[']|[\"]|[<]|[,]|[>]|[.]|[/]|[\\]|[?]|[|]|[-]|[_]|[+]|[=]|[~]|[`]/;
    if (!symbolPattern.test(model.password)) {
      errors.push("Password must contain at least 1 symbol.");
    }
  }

  /*if (model.roles.length && !_.every(model.roles, function(role) { return /president|manager|coach|player/i.test(role); })) {
    errors.push("Roles are not valid. Must be one of 'President', 'Manager', Coach' or 'Player'.");
  }*/

  return errors;
}

/* Gets the user given the id
 */
var getUserById = function(currentUser, id) {
  var deferred = q.defer();

  if (currentUser && (!id || currentUser.isadmin)) {
    if (!id) {
      deferred.resolve(currentUser);
    }
    else {
      User.findById(id, function(err, user) {
        if (err) {
          deferred.reject(MongoDBManager.processErrors(err));
        }
        else if (user == null) {
          deferred.reject({
            code: 404,
            errors: [{ message: "User not found." }]
          });
        }
        else {
          deferred.resolve(user);
        }
      });
    }
  }
  else {
    deferred.reject({
      code: 403,
      errors: [{ message: "You do not have permission to perform this action." }]
    });
  }

  return deferred.promise;
}

/* Validate and saves a user
 */
var save = function(user, isPasswordChange) {
  var deferred = q.defer();

  var errors = validate(user, validator.isNull(user._id) ? "add" : "edit");

  var doSave = function() {
    user.save(function(err) {
      if (err) {
        deferred.reject(MongoDBManager.processErrors(err));
      }
      else {
        deferred.resolve(toView(user));
      }
    });
  }

  if (errors.length) {
    console.log("Save user failed, %s validation errors", errors);
    deferred.reject({
      code: 400,
      errors: errors
    });
  }
  else if (isPasswordChange) {
    q.when(EncryptionManager.hash(user.password))
      .then(function(hash) {
        console.log("User password has been hashed.")
        user.password = hash;

        // Clear out tokens and reissue a new one for the current session
        //user.accessTokens = [];
        //user.refreshTokens = [];
        //user.authCodes = [];

        doSave();
      })
      .catch(function(err) {
        deferred.reject(err);
      });
  }
  else {
    doSave();
  }

  return deferred.promise;
}

/* Gets a list of all users in the system (must be an admin)
 *
 * @returns {promise<object>}
 */
UserService.prototype.getUsers = function() {
  var deferred = q.defer();

  if (this.$sessionSvc.getCurrentUser() && this.$sessionSvc.getCurrentUser().isadmin) {
    User.find(function(err, users) {
      if (err) {
        deferred.reject(MongoDBManager.processErrors(err));
      }
      else {
        deferred.resolve(users && users.length ? _.map(users, toView) : []);
      }
    });
  }
  else {
    deferred.reject({
      code: 403,
      errors: [{ message: "You do not have permission to perform this action." }]
    });
  }

  return deferred.promise;
}

/* Adds a new user to the system (must be an admin)
 *
 * @param name - required
 * @param email - required
 * @param sms - optional
 * @param password - required
 * @returns {promise<object>}
 */
UserService.prototype.addUser = function(name, email, sms, password) {
  var deferred = q.defer();

  var currentUser = this.$sessionSvc.getCurrentUser();

  if (currentUser && currentUser.isadmin) {

    var user = new User();

    user.name = name;
    user.email = validator.normalizeEmail(email);
    user.sms = validator.whitelist(sms, "0123456789");
    user.password = validator.trim(password)

    q.when(save(user, true))
      .then(function(view) {
          deferred.resolve(view);
      })
      .catch(function(err) {
        deferred.reject(err);
      });
  }
  else {
    deferred.reject({
      code: 403,
      errors: [{ message: "You do not have permission to perform this action." }]
    });
  }

  return deferred.promise;
}

/* Gets a user from the system given his/her id (can only get self unless admin)
 *
 * @param id - optional (defaults to me)
 * @returns {promise<object>}
 */
UserService.prototype.getUser = function(id) {
  var deferred = q.defer();

  q.when(getUserById(this.$sessionSvc.getCurrentUser(), id))
    .then(function(user) {
      deferred.resolve(toView(user));
    })
    .catch(function(err) {
      deferred.reject(err);
    })

  return deferred.promise;
}

/* Updates a user given their id and the new properties (can only update self unless admin)
 *
 * @param id - optional (defaults to me)
 * @param email - required
 * @param sms - optional
 * @param oldpassword - optional
 * @param newpassword - required if oldpassword
 * @param isadmin - optional
 * @returns {promise<object>}
 */
UserService.prototype.updateUser = function(id, email, sms, oldpassword, newpassword, isadmin) {
  console.log("UserService.updateUser(%s, %s, %s, %s, %s, %s)", id, email, sms, oldpassword ? "**" : "", newpassword ? "**" : "", isadmin);

  var deferred = q.defer();
  var currentUser = this.$sessionSvc.getCurrentUser();

  q.when(getUserById(currentUser, id))
    .then(function(user) {

      user.email = validator.normalizeEmail(email);
      user.sms = validator.whitelist(sms, "0123456789");

      var canChangeAdminFlag = function() {
        var d = q.defer();

        if ((currentUser.isadmin || false) && !isadmin) {
          User.count({ isadmin: true }, function(err, count) {
            if (err) {
              d.reject(err);
            }
            else if (count == 1) {
              d.reject({
                code: 400,
                errors: [{ message: "At least one active admin is required." }]
              });
            }
            else {
              d.resolve(true);
            }
          })
        }
        else {
          d.resolve(currentUser.isadmin || false);
        }

        return d.promise;
      }

      var changePassword = function() {
        var d = q.defer();

        if (!validator.isNull(oldpassword)) {
          if (validator.equals(newpassword, oldpassword)) {
            d.reject({
              code: 400,
              errors: [{ message: "New password cannot match old password." }]
            });
          }
          else {
            q.when(EncryptionManager.verify(user.password, oldpassword))
              .then(function(result) {
                if (!result) {
                  d.reject({
                    code: 400,
                    errors: [{ message: "Old password does not match password." }]
                  });
                }
                else {
                  d.resolve(validator.trim(newpassword));
                }
              })
              .catch(function(err) {
                d.reject(err);
              });
          }
        }
        else {
          d.resolve(false);
        }

        return d.promise;
      }

      q.all([changePassword(), canChangeAdminFlag()])
        .then(function(result) {
          console.log("About to save, new password: %s, can reset admin: %s.", result[0] ? "yes" : "no", result[1] ? "yes" : "no");

          if (result[0]) {
            user.password = result[0];
          }
          if (result[1]) {
            user.isadmin = isadmin;
          }

          q.when(save(user, result[0]))
            .then(function(view) {
              console.log("User record %s updated.", view.email);
              deferred.resolve(view);
            })
            .catch(function(err) {
              console.log("Error", err, err.stack);
              deferred.reject(err);
            })
        })
        .catch(function(err) {
          deferred.reject(err);
        })
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
}

/* Deletes a user given their id or the currrent user if none provided
 *
 * @param id = optional (defaults to me)
 * @param password - required if id is null or id = me
 * @returns {promise<object>}
 */
UserService.prototype.deleteUser = function(id, password) {
  var deferred = q.defer();

  var currentUser = this.$sessionSvc.getCurrentUser();
  var isMe = !id || currentUser._id.equals(mongoose.Types.ObjectId(id));

  var deleteUser

  if (isMe) {
    if (validator.isNull(password)) {
      deferred.reject({
        code: 400,
        errors: [{ message: "Password confirmation required to delete yourself." }]
      });
    }
    else {
      q.when(EncryptionManager.verify(currentUser.password, password))
        .then(function(result) {
          if (!result) {
            deferred.reject({
              code: 400,
              errors: [{ message: "Password confirmation failed." }]
            });
          }
          else {
            currentUser.remove(function(err) {
              if (err) {
                deferred.reject(err);
              }
              else {
                deferred.resolve(toView(currentUser));
              }
            });
          }
        })
        .catch(function(err) {
          deferred.reject(err);
        })
    }
  }
  else if (!currentUser.isadmin) {
    deferred.reject({
      code: 403,
      errors: [{ message: "You do not have permission to perform this action." }]
    });
  }
  else {
    q.when(getUserById(req.params.user_id))
      .then(function(user) {
        user.remove(function(err) {
          if (err) {
            deferred.reject(err);
          }
          else {
            deferred.resolve(toView(user));
          }
        });
      })
      .catch(function(err) {
        deferred.reject(err);
      })
  }

  return deferred.promise;
}

console.info("User Service initialized");
module.exports = UserService;
