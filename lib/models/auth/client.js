var mongoose = require("mongoose");

var schema = new mongoose.Schema({
  name: {
    type: String,
    required: "Name is required."
  },
  description: String,
  secret: {
    type: String,
    require: "Secret is required."
  },
  grants: [String],
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    required: "Contact is required.",
  },
  redirects: [String],

});

console.info("Client model initialized")
module.exports = mongoose.model("Client", schema);
