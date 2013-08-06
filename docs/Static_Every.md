## Promise.every() static method

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
```

```javascript
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
