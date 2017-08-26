## DOM Futures

[![Greenkeeper badge](https://badges.greenkeeper.io/1999/dom-futures.svg)](https://greenkeeper.io/)
DOM Promises for browsers and node.js. Acts like a polyfill in browsers without support for DOM Promises, and NPM package for node.js applications.

DOM Promises is a quiet new [spec](http://dom.spec.whatwg.org/#promises) introduced by WhatWG. Promises provide a convenient way to get access to the result of an operation. You can use this package either in browser (it acts like a polyfill if your browser is missing support for DOM Promises) or in your node.js code. This feature used to be called futures.

## Installation
 * node.js: ```npm install dom-futures```
 * browser: use [this](https://github.com/1999/dom-futures/blob/master/lib/futures.js) file

## Usage

```javascript
function fetchJSON(url) {
	return new Promise(function (resolver) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "json";

		xhr.onload = function () {
			if (xhr.response)
				resolver.resolve(xhr.response);
			else
				resolver.reject(new DOMError("JSONError"));
		};

		xhr.onerror = xhr.onabort = function (evt) {
			resolver.reject(new DOMError(evt.type));
		};

		xhr.send();
    });
}

// okay, now check this:
fetchJSON("/user/posts").then(showPosts, showFailcat);
```

As you can see, you can create chains with promises by passing a fulfillCallback function which returns a new Promise. If your fulfillCallback returns some value, the promise will be resolved with it. Check this:

```javascript
fetchJSON("/users").then(function (json) {
	var firstUserId = json.users[0].id;
	return fetchJSON("/users/" + firstUserId);
}).then(function (json) {
	var userCommentsUrl = json.comments.url;
	return fetchJSON("/comments/" + userCommentsUrl);
}).then(function () {
	// and so on...
});
```

DOM Promises also have a bunch of helpers, or so-called "static methods".

### Promise.every()

Returns a promise that is fulfilled or rejected when all values are fulfilled or any is rejected. You should pass promises to this function.

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

### Promise.some()
Returns a promise that is fulfilled or rejected when one of values is fulfilled or all are rejected. You should pass promises to this function.

### Promise.any()
Returns a promise that is fulfilled or rejected when any of values is either fulfilled or rejected. You should pass promises to this function.

### Promise.fulfill(value)
Returns a promise that is fulfilled with result value. This is the easiest way to create a new fulfilled Promise with "value" as a promise result and "fulfilled" as a promise state.

### Promise.resolve(value)
Returns a promise that depends upon value. In fact this kind of static method allows you to create a promises chain from the beginning. If you pass a promise object, the state of returned promise will be set as "pending" and result will be undefined. But if you pass smth other than promise, this will act like you call ```Promise.fulfill(value)```.

### Promise.reject(value)
Returns a promise that is rejected with result value.

## Finally
 * [WHATWG spec](http://dom.spec.whatwg.org/#promises)
 * [MIT License](https://github.com/1999/dom-futures/blob/master/LICENSE)
