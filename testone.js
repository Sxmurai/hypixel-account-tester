const { createClient } = require("minecraft-protocol");

const args = process.argv.slice(2);
if (!args.length) {
  console.log("Please provide the account in email:password form.");
  return;
}

const data = args[0].replace("\r", "").replace("\n", "").split(":");
if (!data[0] || !data[1]) {
  console.log("Could not parse.");
  return;
}

// shitty email test
if (!data[0].includes("@")) {
  console.log("Invalid email address");
  return;
}

const client = createClient({
  host: "hypixel.net",
  username: data[0],
  password: data[1],
  version: "1.8.9",
  auth: "mojang",
});

client
  .on("error", (error) => {
    console.log(`Account has failed to login.`);
  })
  .on("packet", (data, meta, buffer, full) => {
    if (meta.state === "login") {
      if (meta.name === "disconnect") {
        try {
          const reason = data.reason;
          if (reason.includes("banned")) {
            console.log(`Account is banned.`);
          }
        } catch {}
      } else if (meta.name === "success") {
        console.log(`Account has sucessfully logged in, not banned.`);
      }
    }
  });
