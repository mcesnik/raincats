var mongoose = require("mongoose");

var schema = new mongoose.Schema({
  name: {
    type: String,
    required: "Name is required."
  },
  email: {
    type: String,
    required: "Email is required.",
    index: true,
    unique: true
  },
  sms: String,
  password: {
    type: String,
    required: "Password is required."
  },
  accessTokens: [{
      token: String,
      clientId: mongoose.Schema.Types.ObjectId,
      expires: Date
  }],
  refreshTokens: [{
      token: String,
      clientId: mongoose.Schema.Types.ObjectId,
      expires: Date
  }],
  authCodes: [{
      code: String,
      clientId: mongoose.Schema.Types.ObjectId,
      expires: Date
  }],
  isadmin: Boolean
});

console.info("User model initialized")
module.exports = mongoose.model("User", schema);
