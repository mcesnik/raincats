var express = require('express');
var q = require("q");

var UserService = require("./../services/auth/user-svc");

var router = express.Router();
var route = router.route("/");

route.get(function(req, res) {

  var $userService = new UserService(req, res)

  q.when($userService.getUsers())
		.then(function(users) {
			res.json(users);
		})
		.catch(function(err) {
			res.status(err.code).send(err.errors);
		});
});

route.post(function(req, res, next) {

  var $userService = new UserService(req, res);

	q.when($userService.addUser(req.body.name, req.body.email, req.body.sms, req.body.password))
		.then(function(users) {
			res.json(users);
		})
		.catch(function(err) {
			res.status(err.code).send(err.errors);
		});
});

console.info("Users route initialized");
module.exports = router;
