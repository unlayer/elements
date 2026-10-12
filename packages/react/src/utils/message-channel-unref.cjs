// Loaded just before react-dom/server.browser (see server-renderer.ts), and message-channel-restore.cjs just after.
// React 19's browser server build opens a MessageChannel when it loads (for the streams Elements never uses), and
// in Node a port with a message listener keeps the process alive: a script that renders an email would never exit.
// While that build loads, the ports a MessageChannel opens don't keep Node alive (they still work); then the
// global is put back. Only where ports can do that (Node): browsers and edge runtimes are left as they are.
// Plain script syntax, so it loads the same as CommonJS or as a module.
(function () {
  var g = globalThis;
  var key = Symbol.for("@unlayer/react-elements/message-channel");
  var Native = g.MessageChannel;
  var Port = g.MessagePort;
  if (typeof Native !== "function" || !Port || typeof Port.prototype.unref !== "function" || g[key]) return;
  var unref = function (port) {
    try {
      port.unref();
    } catch (e) {}
  };
  // Setting `onmessage` makes the port keep Node alive again: unref it after.
  var keepUnref = function (port) {
    var proto = Object.getPrototypeOf(port);
    var descriptor;
    while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, "onmessage"))) proto = Object.getPrototypeOf(proto);
    if (descriptor && descriptor.get && descriptor.set) {
      Object.defineProperty(port, "onmessage", {
        configurable: true,
        enumerable: true,
        get: function () {
          return descriptor.get.call(port);
        },
        set: function (value) {
          descriptor.set.call(port, value);
          unref(port);
        },
      });
    }
    unref(port);
  };
  var Unreferenced = function MessageChannel() {
    var channel = new Native();
    keepUnref(channel.port1);
    keepUnref(channel.port2);
    return channel;
  };
  Unreferenced.prototype = Native.prototype;
  g[key] = Native;
  g.MessageChannel = Unreferenced;
  // Put back even if the restore isn't loaded (a bundler that dropped it): after this synchronous load.
  if (typeof queueMicrotask === "function") {
    queueMicrotask(function () {
      if (g[key] === Native) {
        g.MessageChannel = Native;
        delete g[key];
      }
    });
  }
})();
