const net = require("net");

const HOST = process.env.LIQUIDSOAP_HOST || "liquidsoap";
const PORT = Number(process.env.LIQUIDSOAP_PORT || 1234);

// Liquidsoap's telnet protocol is plain text: send "<command>\n",
// read lines back until one reads exactly "END".
function sendCommand(command, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: HOST, port: PORT });
    let buffer = "";

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`telnet command timed out: ${command}`));
    }, timeoutMs);

    const finish = (fn, value) => {
      clearTimeout(timer);
      socket.destroy();
      fn(value);
    };

    socket.on("connect", () => socket.write(command + "\n"));

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (buffer.includes("\nEND")) {
        finish(resolve, buffer.split("\nEND")[0].trim());
      }
    });

    socket.on("error", (err) => finish(reject, err));
  });
}

module.exports = { sendCommand };
