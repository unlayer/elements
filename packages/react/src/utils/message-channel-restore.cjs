// Loaded just after react-dom/server.browser: MessageChannel is as it was (see message-channel-unref.cjs).
(function () {
  var g = globalThis;
  var key = Symbol.for("@unlayer/react-elements/message-channel");
  if (g[key]) {
    g.MessageChannel = g[key];
    delete g[key];
  }
})();
