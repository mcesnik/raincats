var q = require("q");
var consoleStamp = require('console-stamp')(console, 'HH:MM:ss.l');

console.info("Starting Web-API");

var PropertiesManager = require("./properties-manager");
var MongoDBManager = require("./mongodb-manager");
var ExpressManager = require("./express-manager");

q.when(PropertiesManager.getProperties())
	.then(function(properties) {

		if (!properties.debug) {
			console.info("Debug Mode is now disabled");

			console.log = function() { }
			console.info = function() { }
		}

		q.when(MongoDBManager.connect())
			.then(function(connection) {
				console.info("MongoDB connected (%s)", connection.name);
				q.when(ExpressManager.init())
					.then(function(express) {
						console.info("Web-API initialized");
					})
					.catch(function(err) {
						connection.close();
						console.error("Failed to initialize express, application terminating..", err, err.stack);
					});
			})
			.catch(function(err) {
				console.error("Failed to connect to MongoDB, application terminating..", err, err.stack);
			});
	})
	.catch(function(err) {
		console.error("Failed to load properties, application terminating..", err, err.stack);
	});
