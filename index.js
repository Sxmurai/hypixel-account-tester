const { readFileSync, writeFileSync } = require("fs");
const { createClient } = require("minecraft-protocol");

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const parseAccounts = () => {
  const data = readFileSync("accounts.txt").toString("ascii").split("\n");

  const accounts = [];

  for (const line of data) {
    // comment line
    if (line.startsWith("#")) {
      continue;
    }

    const account = line.replace("\r", "").replace("\n", "").split(":");

    if (!account[0]) {
      continue;
    }

    accounts.push({
      username: account[0],
      password: account[1],
      banned: false,
    });
  }

  return accounts;
};

const accounts = parseAccounts();
let tested = 0;

const testAccount = (account) => {
  const client = createClient({
    host: "hypixel.net",
    username: account.username,
    password: account.password,
    version: "1.8.9",
    auth: "mojang",
  });

  client.on("error", (error) => {
    ++tested;
    console.log(`Account ${account.username} has failed to login.`);

    // doesnt mean this one was banned, but we should consider it an unbanned account either
    account.banned = true;

    testOrFinish();
  })

  client.on("packet", (data, meta, buffer, full) => {
    if (meta.state === "login") {
        if (meta.name === "disconnect") {
            try {
                const reason = data.reason;
                if (reason.includes("banned")) {
                    console.log(`${account.username} was banned, testing next account.`);
                    // doesnt mean this one was banned, but we should consider it an unbanned account either
                    account.banned = true;
                }

                ++tested;

                testOrFinish();
            } catch {}
        } else if (meta.name === "success") {
            console.log(`${account.username} sucessfully logged in, not banned.`);
            ++tested;

            testOrFinish();
        }
    }
  });
}

testAccount(accounts[0]);

const testOrFinish = () => {
    if (tested < accounts.length) {
        // the wait is because it seems that we get ratelimited for how much we can login to an account.
        // you can remove this if you want, but im keeping it there, or make the wait shorter
        wait(5 * 1000).then(() => testAccount(accounts[tested]));
        return;
    }

    console.log(`\n\nFinished testing ${accounts.length} accounts, writing unbanned accounts to file.`);

    let unbanned = 0, text = "";
    for (const account of accounts) {
        if (account.banned) {
            continue;
        }

        text += `${account.username}:${account.password}\n`;
        ++unbanned;
    }

    writeFileSync("output.txt", text);
    console.log(`${unbanned} account(s) were added to the file`);

    process.exit();
}