// Get the packages we need
var express = require('express');
var mongoose = require("mongoose");

var Post = require("./../models/post")

var router = express.Router();

var route = router.route("/:post_id");

route.get(function(req, res) {
	Post.findById(req.params.post_id, function(err, post) {

		if (err) {
			res.send(err);
		}

		res.json(post);
	});
});

route.put(function(req, res, next) {

	Post.findById(req.params.post_id, function(err, post) {

		if (err) {
			res.send(err);
		}

		post.title = req.body.title;
		post.author = req.body.author;
		post.date = new Date();
		post.image = req.body.image;
		post.body = req.body.body;

		post.save(function(err) {
			if (err) {
				res.send(err);
			}

			res.json(post);
		});
	});
});

console.log("\"post\" route initialized");
module.exports = router;
