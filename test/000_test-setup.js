var chai = require("chai"),
    assert = chai.assert,
    expect = chai.expect,
    should = chai.should();

console.info = function() {}

process.env.properties = "test.properties";

global.test = {};