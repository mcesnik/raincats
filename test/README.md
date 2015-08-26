# RainCats API Test Package

This package is used to test the API and all associated modules using [Mocha](https://mochajs.org/).

Tests are broken down into two categories.

1. Manager Tests 
  * Tests all managers associated with making the API start and run.
2. Route Tests
  * Each route in its own file.  Each test suite should start and stop the API engine and perform simple authentication (if necessary).

## Installation

* Install Mocha

```Shell
npm install -g mocha
```

* Run the tests

```Shell
mocha test/test-*.js
```


