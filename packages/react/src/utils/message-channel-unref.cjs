// Loaded just before react-dom/server.browser (see server-renderer.ts), and message-channel-restore.cjs just after.
// React 19's browser server build opens a MessageChannel when it loads (for the streams Elements never uses), and
// in Node a port with a message listener keeps the process alive: a script that renders an email would never exit.
// While that build loads, the ports a MessageChannel opens don't keep Node alive (they still work); then the
// global is put back. Only where ports can do that (Node): browsers and edge runtimes are left as they are.
// Where there's no MessageChannel at all (Jest's jsdom environment), that build would throw when it loads: one that
// delivers messages with setTimeout stands in while it loads, then it's removed.
// Plain script syntax, so it loads the same as CommonJS or as a module.
(function () {
  var g = globalThis;
  var key = Symbol.for("@unlayer/react-elements/message-channel");
  var Native = g.MessageChannel;
  var Port = g.MessagePort;
  if (key in g) return;
  if (typeof Native !== "function") {
    var StandIn = function MessageChannel() {
      var port = function () {
        var self = { onmessage: null, close: function () {}, start: function () {}, addEventListener: function () {}, removeEventListener: function () {} };
        self.postMessage = function (data) {
          setTimeout(function () {
            if (typeof self.other.onmessage === "function") self.other.onmessage({ data: data });
          }, 0);
        };
        return self;
      };
      this.port1 = port();
      this.port2 = port();
      this.port1.other = this.port2;
      this.port2.other = this.port1;
    };
    g[key] = null;
    g.MessageChannel = StandIn;
    if (typeof queueMicrotask === "function") {
      queueMicrotask(function () {
        if (key in g && g[key] === null) {
          delete g.MessageChannel;
          delete g[key];
        }
      });
    }
    return;
  }
  if (!Port || typeof Port.prototype.unref !== "function") return;
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
