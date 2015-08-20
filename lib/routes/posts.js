// Get the packages we need
var express = require('express');
var mongoose = require("mongoose");

var Post = require("./../models/post")

var router = express.Router();

var route = router.route("/");

route.get(function(req, res) {
	Post.find(function(err, posts) {

		if (err) {
			res.send(err);
		}

		res.json(posts);
	})
});

route.post(function(req, res, next) {
	var post = new Post();

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
	})

});

console.log("\"posts\" route initialized");
module.exports = router;
