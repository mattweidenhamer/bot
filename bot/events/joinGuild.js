const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    console.log(guild.ownerID);
    owner = await guild.fetchOwner();
    console.log(
      "Joined new guild " +
        guild.name +
        " (ID: " +
        guild.id +
        ") owned by snowflake " +
        guild.ownerID +
        " (username " +
        owner.username +
        ") with " +
        guild.memberCount +
        " members."
    );

    if (!guild.roles.cache.some((role) => role.name === "Puppeteer")) {
      console.log("No Puppeteer role, creating one...");
      guild.roles.create({
        name: "Puppeteer",
        color: "Red",
        reason:
          "Puppeteer role for the Puppeteer bot. Members with this role can summon Puppetmaster. Has no server permissions.",
      });
    }
  },
};
