// ================= IMPORTS =================
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require("express");

// ================= LOCAL IMPORTS =================
const { distubeOptions } = require("./src/config/config.js");
const PlayerManager = require("./src/player/PlayerManager.js");
const { printWatermark } = require("./src/config/type.js");

// ================= DISCORD CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

printWatermark();

// ================= COLLECTIONS =================
client.commands = new Collection();

// ================= PLAYER MANAGER =================
client.playerManager = new PlayerManager(client, distubeOptions);
client.playerManager.distube.setMaxListeners(20);

// ================= COMMAND HANDLER =================
const commandsPath = path.join(__dirname, "src", "commands");

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command?.data?.name) {
      client.commands.set(command.data.name, command);
    }
  }
}

// ================= EVENT HANDLER =================
const eventsPath = path.join(__dirname, "src", "events");

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));

    if (event.once) {
      client.once(event.name, (...args) =>
        event.execute(...args, client)
      );
    } else {
      client.on(event.name, (...args) =>
        event.execute(...args, client)
      );
    }
  }
}

// ================= EXPRESS SERVER (RENDER KEEP-ALIVE) =================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🤖 Discord Bot is running!");
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ================= LOGIN =================
if (!process.env.TOKEN) {
  console.error("❌ TOKEN is missing in environment variables");
  process.exit(1);
}

client.login(process.env.TOKEN);
