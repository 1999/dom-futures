// @see http://dom.spec.whatwg.org/#promises
(function (exports) {
    "use strict";

    if (exports.Promise)
        return;

    var PROMISE_STATES = {
        PENDING: "pending",
        FULFILLED: "fulfilled",
        REJECTED: "rejected"
    };

    function processTask(callback, immediately, ctx) {
        if (immediately) {
            callback.call(ctx);
        } else {
            setTimeout(function () {
                callback.call(ctx);
            }, 0);
        }
    }

    function PromiseResolver(promise) {
        this.promise = promise;
        this.resolved = false;
    };

    PromiseResolver.prototype = {
        fulfill: function (value, synchronous) {
            if (this.resolved)
                return;

            this.resolved = true;
            this.promise.state = PROMISE_STATES.FULFILLED;
            this.promise.result = value;

            processTask(function () {
                this.promise.fulfillCallbacks.forEach(function (callback) {
                    callback(value);
                });

                this.promise.fulfillCallbacks.length = 0;
            }, synchronous, this);
        },

        /**
         * In fact resolve() is fulfill() with support for fulfill(promise) which allows promises chaining
         */
        resolve: function (value, synchronous) {
            if (this.resolved)
                return;

            if (!(value instanceof Promise))
                return this.fulfill(value, synchronous);

            var currentResolver = this;

            value.then(function (value) {
                currentResolver.resolve(value, true);
            }, function (value) {
                currentResolver.reject(value, true);
            });
        },

        reject: function (value, synchronous) {
            if (this.resolved)
                return;

            this.resolved = true;
            this.promise.state = PROMISE_STATES.REJECTED;
            this.promise.result = value;

            processTask(function () {
                this.promise.rejectCallbacks.forEach(function (callback) {
                    callback(value);
                });

                this.promise.rejectCallbacks.length = 0;
            }, synchronous, this);
        }
    };

    /**
     * Creates a new promise. The init callback is passed the associated resolver.
     * If the callback throws an exception, the promise's associated resolver's reject is run with the thrown exception.
     *
     * @constructor
     * @return {Promise}
     */
    function Promise(promiseInit) {
        this.state = PROMISE_STATES.PENDING;
        this.result = undefined;
        this.resolver = new PromiseResolver(this);

        this.fulfillCallbacks = [];
        this.rejectCallbacks = [];

        try {
            promiseInit.call(this, this.resolver);
        } catch (ex) {
            this.resolver.reject(ex);
        }
    };

    Promise.prototype = {
        /**
         * Appends callbacks to promise of which one will be invoked with promise's result
         * at some point after promise's state is set to either fulfilled or rejected.
         *
         * @param {Function} fulfillCallback
         * @param {Function} rejectCallback
         * @return {Promise} new promise
         */
        then: function (fulfillCallback, rejectCallback) {
            var currentPromise = this;

            return new Promise(function (resolver) {
                var returnValue;

                function fulfill() {
                    if (typeof fulfillCallback === "function") {
                        var returnValue = fulfillCallback(currentPromise.result);

                        try {
                            resolver.resolve(returnValue);
                        } catch (ex) {
                            resolver.reject(ex);
                        }
                    } else {
                        resolver.resolve(currentPromise.result);
                    }
                }

                function reject() {
                    if (typeof rejectCallback === "function") {
                        var returnValue = rejectCallback(currentPromise.result);

                        try {
                            resolver.resolve(returnValue);
                        } catch (ex) {
                            resolver.reject(ex);
                        }
                    } else {
                        resolver.reject(currentPromise.result);
                    }
                }

                switch (currentPromise.state) {
                    case PROMISE_STATES.PENDING:
                        currentPromise.fulfillCallbacks.push(fulfill);
                        currentPromise.rejectCallbacks.push(reject);
                        break;

                    case PROMISE_STATES.FULFILLED:
                        fulfill();
                        break;

                    case PROMISE_STATES.REJECTED:
                        reject();
                        break;
                }
            });
        },

        /**
         * Identical to invoking promise.then(undefined, rejectCallback)
         * 
         * @param {Function} rejectCallback
         * @return {Promise} new promise
         */
        catch: function (rejectCallback) {
            this.then(undefined, rejectCallback);
        }
    };

    /**
     * Returns a promise that is fulfilled with result value
     * 
     * @param {Mixed} value
     * @return {Promise}
     */
    Promise.fulfill = function (value) {
        return new Promise(function (resolver) {
            resolver.fulfill(value);
        });
    };

    /**
     * Returns a promise that depends upon value
     * 
     * @param {Mixed} value
     * @return {Promise}
     */
    Promise.resolve = function (value) {
        return new Promise(function (resolver) {
            resolver.resolve(value);
        });
    };

    /**
     * Returns a promise that is rejected with result value
     * 
     * @param {Mixed} value
     * @return {Promise}
     */
    Promise.reject = function (value) {
        return new Promise(function (resolver) {
            resolver.reject(value);
        });
    };

    /**
     * Returns a promise that is fulfilled or rejected when any of values is either fulfilled or rejected.
     * 
     * @return {Promise}
     */
    Promise.any = function () {
        var args = arguments;

        return new Promise(function (resolver) {
            if (args.length === 0)
                return resolver.resolve(undefined);

            Array.prototype.forEach.call(args, function (promise, index) {
                promise.then(function (result) {
                    resolver.resolve(undefined);
                }, function (result) {
                    resolver.resolve(undefined);
                });
            });
        });
    };

    /**
     * Returns a promise that is fulfilled or rejected when all values are fulfilled or any is rejected.
     * 
     * @return {Promise}
     */
    Promise.every = function () {
        var index = 0;
        var countdown = arguments.length;
        var results = new Array(countdown);
        var args = arguments;

        return new Promise(function (resolver) {
            if (countdown === 0)
                return resolver.resolve(undefined);

            Array.prototype.forEach.call(args, function (promise, index) {
                promise.then(function (result) {
                    results[index] = result;
                    countdown -= 1;

                    if (countdown === 0) {
                        resolver.resolve(results, true);
                    }
                }, function (result) {
                    resolver.reject(result);
                });
            });
        });
    };

    /**
     * Returns a promise that is fulfilled or rejected when one of values is fulfilled or all are rejected.
     * 
     * @return {Promise}
     */
    Promise.some = function () {
        var index = 0;
        var countdown = arguments.length;
        var results = new Array(countdown);
        var args = arguments;

        return new Promise(function (resolver) {
            if (countdown === 0)
                return resolver.resolve(undefined);

            Array.prototype.forEach.call(args, function (promise, index) {
                promise.then(function (result) {
                    resolver.resolve(result);
                }, function (result) {
                    results[index] = result;
                    countdown -= 1;

                    if (countdown === 0) {
                        resolver.reject(results, true);
                    }
                });
            });
        });
    };

    exports.Promise = Promise;
})(typeof exports === "undefined" ? window : exports);
