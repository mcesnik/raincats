var express = require('express');
var q = require("q");

var UserService = require("./../services/auth/user-svc");

var router = express.Router();
var route = router.route("/:user_id?");

route.get(function(req, res) {
	var $userService = new UserService(req, res)

	q.when($userService.getUser(req.params.user_id))
		.then(function(user) {
			if (!user) {
				res.status(404).send();
			}
			else {
				res.json(user);
			}
		})
		.catch(function(err) {
			res.status(err.code).send(err.errors);
		});
});

route.put(function(req, res, next) {
	var $userService = new UserService(req, res);

	q.when($userService.updateUser(req.params.user_id, req.body.email, req.body.sms, req.body.oldpassword, req.body.newpassword, req.body.isadmin || false))
		.then(function(user) {
			if (!user) {
				res.status(500).send();
			}
			else {
				res.json(user);
			}
		})
		.catch(function(err) {
			res.status(err.code).send(err.errors);
		});
});

route.delete(function(req, res, next) {
	var $userService = new UserService(req, res);

	q.when($userService.deleteUser(req.params.user_id, req.body.password))
		.then(function(user) {
			res.json(user);
		})
		.catch(function(err) {
			res.status(err.code).send(err.errors);
		})
});

console.info("User route initialized");
module.exports = router;
