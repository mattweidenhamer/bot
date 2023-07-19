const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    const logger = guild.client.logger;
    logger.debug("Joined new guild " + guild.name + " (ID: " + guild.id + ")");
    owner = await guild.fetchOwner();
    logger.info(
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
      logger.debug("No Puppeteer role, creating one...");
      guild.roles.create({
        name: "Puppeteer",
        color: "Red",
        reason:
          "Puppeteer role for the Puppeteer bot. Members with this role can summon Puppetmaster. Has no server permissions.",
      });
    }
  },
};
