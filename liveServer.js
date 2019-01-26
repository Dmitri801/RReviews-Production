const liveServer = require("live-server");

const params = {
  port: 9999,
  root: "src",
  logLevel: 1
};

liveServer.start(params);
