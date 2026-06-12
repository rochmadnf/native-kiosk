import os from "node:os";
import { spawn } from "node:child_process";

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

function draw() {
  console.clear();

  const ip = getLocalIp();

  console.log("========================================");
  console.log(`IP Address : ${ip}`);
  console.log("========================================");
  console.log("");

  services.forEach((service) => {
    const icon = service.running ? "🟢" : "🔴";

    console.log(`${icon} ${service.name.padEnd(10)} ${service.url}`);
  });

  console.log("");
  console.log("Ctrl+C untuk menghentikan semua service");
}

function startService(name, command, args, url) {
  const service = {
    name,
    url,
    running: true,
  };

  services.push(service);

  const child = spawn(command, args, {
    shell: true,
    stdio: "ignore",
  });

  child.on("exit", () => {
    service.running = false;
    draw();
  });

  draw();

  return child;
}

const ip = getLocalIp();

startService(
  "PHP",
  "php",
  ["-S", "0.0.0.0:8082", "-t", "./print-struck"],
  `http://${ip}:8082`,
);

startService("NODE", "serve", ["-l", "3000", ""], `http://${ip}:3000`);
