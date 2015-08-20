var mongoose = require("mongoose");

var post = new mongoose.Schema({
  title: String,
  author: String,
  date: Date,
  image: String,
  body: String
});

console.info("Post model initialized")
module.exports = mongoose.model("Post", post);
