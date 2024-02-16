const Logger = new EventTarget;
Logger.messages = [];

// https://stackoverflow.com/a/11403146
(function() {
  const log = console.log;
  console.log = function () {
    const message = [
      `[${new Date().toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })}]`,
      ...arguments
    ]
    Logger.messages.push(message);
    Logger.dispatchEvent(new MessageEvent("message", { data: message }));
    log.apply(console, message);
  };
})();
