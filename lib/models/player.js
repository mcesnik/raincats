var mongoose = require("mongoose");

var player = new mongoose.Schema({
  name: String,
  positions: [String],
  number: {
  	type: Number,
	min: 0
	max: 99
  },
  aliases: [String]
});

console.log("Player model initialized")
module.exports = mongoose.model("Player", player);
