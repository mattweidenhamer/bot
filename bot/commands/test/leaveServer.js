const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("leaveserver")
    .setDescription("Leaves the server"),
  async execute(interaction) {
    if (!interaction.guild)
      return interaction.reply(":x:: You can't use this command in DMs!");
    if (
      !interaction.member.roles.cache.some(
        (role) => role.name === "Puppeteer"
      ) ||
      !interaction.member.permissions.has(
        PermissionsBitField.FLAGS.ADMINISTRATOR
      )
    )
      return interaction.reply(
        ":x:: You need to have the Puppeteer role or be an administrator to use this command!"
      );
    interaction.reply(
      "Okay! Leaving the server! To report a bug or for additional support, feel free to email the developer at puppetshowbot@gmail.com"
    );
    interaction.guild.leave().then((guild) => {
      console.log(
        `Left the guild ${guild.name} (ID: ${guild.id}) after user ${interaction.user.tag} used the /leaveServer command.`
      );
    });
  },
};
