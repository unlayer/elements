// Loaded just after react-dom/server.browser: MessageChannel is as it was (see message-channel-unref.cjs).
(function () {
  var g = globalThis;
  var key = Symbol.for("@unlayer/react-elements/message-channel");
  if (key in g) {
    // null: there was none (a stand-in was put there).
    if (g[key] === null) delete g.MessageChannel;
    else g.MessageChannel = g[key];
    delete g[key];
  }
})();
