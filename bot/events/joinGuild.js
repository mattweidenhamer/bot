const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildCreate,
  execute(guild) {
    owner = guild.resolve(guild.ownerID);
    console.log(
      "Joined new guild " +
        guild.name +
        " (ID: " +
        guild.id +
        ") owned by snowflake " +
        guild.ownerID +
        " (username " +
        owner.user.username +
        " with " +
        guild.memberCount +
        " members."
    );
    guild.comm;

    if (!guild.roles.cache.some((role) => role.name === "Puppeteer")) {
      console.log("No Puppeteer role, creating one...");
      guild.roles.create({
        name: "Puppeteer",
        color: "RED",
        reason:
          "Puppeteer role for the Puppeteer bot. Members with this role can summon Puppetmaster. Has no server permissions.",
      });
    }
  },
};
