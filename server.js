import os from "node:os";

const services = [];

function getLocalIp() {
  const interfaces = os.networkInterfaces();

  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "127.0.0.1";
}

const ip = getLocalIp();

console.log("========================================");
console.log(`🛜 IP: ${ip}`);
