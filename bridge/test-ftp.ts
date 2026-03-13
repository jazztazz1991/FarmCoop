import "dotenv/config";
import * as ftp from "basic-ftp";
import { loadConfig } from "./bridge.config";

async function testFtp() {
  const config = loadConfig();
  const client = new ftp.Client();
  client.ftp.verbose = true;

  console.log(`Connecting to ${config.ftp.host}:${config.ftp.port} as ${config.ftp.user}`);

  try {
    await client.access({
      host: config.ftp.host,
      port: config.ftp.port,
      user: config.ftp.user,
      password: config.ftp.password,
      secure: config.ftp.secure,
    });

    console.log("\n=== Connected! Listing root directory ===\n");
    const rootList = await client.list("/");
    for (const item of rootList) {
      console.log(`  ${item.type === 2 ? "[DIR]" : "[FILE]"} ${item.name}`);
    }

    // Try to find modSettings
    const pathsToTry = [
      "/profile",
      "/profile/modSettings",
      "/profile/mods",
      "/profile/savegame1",
    ];

    for (const p of pathsToTry) {
      try {
        const list = await client.list(p);
        console.log(`\n=== Found: ${p} ===\n`);
        for (const item of list) {
          console.log(`  ${item.type === 2 ? "[DIR]" : "[FILE]"} ${item.name}`);
        }
      } catch {
        console.log(`\n  ${p} — not found`);
      }
    }
  } catch (err) {
    console.error("FTP connection failed:", err);
  } finally {
    client.close();
  }
}

testFtp();
