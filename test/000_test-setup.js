var chai = require("chai"),
    assert = chai.assert,
    expect = chai.expect,
    should = chai.should();

console.info = function() {}

process.env.properties = "test.properties";

global.test = {
  client: {
    name: "client",
    secret: "secret",
    grants: ["password", "refresh_token"]
  },

  admin: {
    name: "Admin",
    password: "password",
    email: "email@admin.com",
    sms: "1234567890"
  }
};
