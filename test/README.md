# RainCats API Test Package

This package is used to test the API and all associated modules using [Mocha](https://mochajs.org/).

Tests are broken down into several categories.

### 00x. Setups
Configure any test variables on `global.test` and any other setup you wish to execute before tests actually run.

### 10x. Managers
Test any application managers that may be required during the application lifecycle.

### 20x. Services
Test any services that are used by routes or any other component. Service related tests should only test for positive outcomes.

### 30x. Routes
Test API routes explicitly.  Any and all exceptions should be tested at this level.

### 90x. Teardown
Teardown anything the test may have setup during its execution that should not remain for the next test run.

## Installation

* Install Mocha

```Shell
npm install -g mocha
```

* Run the tests

```Shell
npm test
```
