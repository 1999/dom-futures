## DOM Futures
DOM Promises for browsers and node.js. DOM Promises is a quiet new [spec](http://dom.spec.whatwg.org/#promises) introduced by WhatWG. Promises provide a convenient way to get access to the result of an operation. You can use this package either in browser (it acts like a polyfill if your browser is missing support for DOM Promises) or in your node.js code. This feature used to be called futures.

## Installation
 * node.js: ```npm install dom-futures```
 * browser: download [this](https://github.com/1999/dom-futures/blob/master/lib/futures.js) file

## Usage

### Promise.every() static method

Returns a promise that is fulfilled or rejected when all values are fulfilled or any is rejected.

```javascript
// browser example
function loadResource(url) {
	return new Promise(function (resolver) {
		var xhr = new XMLHttpRequest;
		xhr.withCredentials = true;
		xhr.open("GET", url, true);

		xhr.onload = function (evt) {
			resolver.resolve(evt.target.responseText);
		};

		xhr.onerror = function (evt) {
			resolver.reject(evt.type);
		};

		xhr.send();
	});
}

Promise.every(loadResource("http://google.com"), loadResource("http://stackoverflow.com")).then(function (htmlContents) {
	// htmlContents is 2-elements array
}, function (err) {
	// handle err
});

// node.js example
var Promise = require("dom-futures").Promise;
var fs = require("fs");

function readFile(path) {
	return new Promise(function (resolver) {
		fs.readFile(path, "utf-8", function (err, contents) {
			if (err) {
				resolver.reject(err);
			} else {
				resolver.resolve(contents);
			}
		});
	});
}

Promise.every(readFile("/etc/hosts"), readFile("/etc/group"), readFile("/etc/shadow")).then(function (filesContents) {
	// filesContents is 3-elements array
}, function (err) {
	// handle err
});
```

## Finally
 * [WHATWG spec](http://dom.spec.whatwg.org/#promises)
 * [MIT License](https://github.com/1999/dom-futures/blob/master/LICENSE)
