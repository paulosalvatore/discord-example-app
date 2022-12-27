import { InteractionResponseType, InteractionType } from 'discord-interactions';
import { Events } from 'discord.js';
import 'dotenv/config';
import express from 'express';
import { ANSWER_COMMAND, HasGuildCommands } from './commands.js';
import discordClient from './discord-client.js';
import { getOpenAiResponse } from './openai.js';
import { DiscordRequest, VerifyDiscordRequest } from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "responder" guild command
    if (name === 'responder') {
      const { resolved } = data;

      const { content } = Object.values(resolved.messages)[0];

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content,
        },
      });
    }
  }
});

app.listen(PORT, async () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.js are installed (if not, install them)
  await HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    ANSWER_COMMAND,
  ]);

  console.log('Ready! 🚀');
});

discordClient.on(Events.MessageCreate, async (message) => {
  const { id: messageId, channelId, content } = message;

  let discordMessage = '';

  try {
    discordMessage = await getOpenAiResponse(message.content);
  } catch (error) {
    console.error(error);

    discordMessage =
      'Algum erro ocorreu ao tentar processar sua mensagem. Tente novamente mais tarde.';
  }

  DiscordRequest(`channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    body: {
      content: `**${content}:**\n\n> ${discordMessage.replace(/\n/g, '\n> ')}`,
    },
  });
});
