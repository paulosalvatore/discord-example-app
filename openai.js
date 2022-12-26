import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function getOpenAiResponse(prompt, showLogs = false) {
  const initialPrompt = prompt + '\n\n';

  if (showLogs) {
    console.log(`>>>> ${prompt} <<<<`);
  }

  let fullResponse = '';

  while (true) {
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: initialPrompt + fullResponse,
      temperature: 0.6,
    });

    const { finish_reason: finishReason, text } = completion.data.choices[0];

    fullResponse += text;

    if (showLogs) {
      process.stdout.write(text);
    }

    if (finishReason === 'stop') {
      if (showLogs) {
        process.stdout.write('\n\n');
        break;
      }

      return fullResponse;
    }
  }
}
