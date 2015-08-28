var chai = require("chai"),
    assert = chai.assert,
    expect = chai.expect,
    should = chai.should()
    q = require("q");

describe("Teardown", function() {
  var manager = require("./../lib/mongodb-manager");

  it("should be able to tear down a database", function(done) {
    q.when(manager.drop())
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      })
  })
})

if (global.test.express) {
  global.test.express.close();
}

if (global.test.monogodb) {
  global.test.monogodb.close();
}
