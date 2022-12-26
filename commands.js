import { getRPSChoices } from './game.js';
import { capitalize, DiscordRequest } from './utils.js';

export async function HasGuildCommands(appId, guildId, commands) {
  if (guildId === '' || appId === '') return;

  return Promise.all(commands.map((c) => HasGuildCommand(appId, guildId, c)));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const commands = await res.json();

    if (!commands) {
      return;
    }

    const installedNames = commands.map((c) => c['name']);

    // This is just matching on the name, so it's not good for updates
    if (!installedNames.includes(command['name'])) {
      console.log(`Installing "${command['name']}"`);

      InstallGuildCommand(appId, guildId, command);

      return;
    }

    if (process.env.REINSTALL_COMMANDS === '1') {
      console.log(`Reinstalling "${command['name']}"`);

      ReinstallGuildCommand(
        appId,
        guildId,
        commands.find((c) => c.name === c['name'])
      );

      return;
    }

    console.log(`"${command['name']}" command already installed`);
  } catch (err) {
    console.error(err);
  }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  // install command
  try {
    await DiscordRequest(endpoint, { method: 'POST', body: command });
  } catch (err) {
    console.error(err);
  }
}

// Uninstalls a command
export async function ReinstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands/${command.id}`;

  // reinstall command
  try {
    await DiscordRequest(endpoint, { method: 'PATCH', body: command });
  } catch (err) {
    console.error(err);
  }
}

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple answer command
export const ANSWER_COMMAND = {
  name: 'responder',
  description: '',
  type: 3,
};
