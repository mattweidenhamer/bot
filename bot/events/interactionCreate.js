// const { Events, Collection } = require("discord.js");
// const { cooldowns } = client;

// module.exports = {
//   name: Events.InteractionCreate,
//   async execute(interaction) {
//     if (!interaction.isChatInputCommand()) return;

//     const command = interaction.client.commands.get(interaction.commandName);

//     if (!command) {
//       console.error(
//         `No command matching ${interaction.commandName} was found.`
//       );
//       return;
//     }

//     if (!cooldowns.has(interaction.commandName)) {
//       cooldowns.set(command.data.name, new Collection());
//     }

//     const now = Date.now();
//     const timestamps = cooldowns.get(command.data.name);
//     const defaultCooldownDuration = 3;
//     const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

//     if (timestamps.has(interaction.user.id)) {
//       const expirationTime =
//         timestamps.get(interaction.user.id) + cooldownAmount;

//       if (now < expirationTime) {
//         const timeLeft = (expirationTime - now) / 1000;
//         return interaction.reply({
//           content: `Please wait ${timeLeft.toFixed(
//             1
//           )} more second(s) before reusing the \`${
//             interaction.commandName
//           }\` command.`,
//           ephemeral: true,
//         });
//       }
//     }

//     timestamps.set(interaction.user.id, now);
//     setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

//     try {
//       await command.execute(interaction);
//     } catch (error) {
//       console.error(`Error executing ${interaction.commandName}`);
//       console.error(error);
//     }
//   },
// };
