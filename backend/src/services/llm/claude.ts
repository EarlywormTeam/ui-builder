import Anthropic from '@anthropic-ai/sdk';
import { LlmMessage } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

/**
 * @param messages - The messages to send to LLM, must be an array of {role, content} objects.
 * @param temperature - The temperature to use for the LLM query, must be between 0 and 1.
 * @returns A promise that resolves to a message object.
 * @throws If the LLM errors out.
 */
async function queryLlm(messages: LlmMessage[], temperature: number = 0): Promise<LlmMessage> {
  console.log('queryLlm:', JSON.stringify(messages));
  const systemPrompt = messages.filter(msg => msg.role === 'system').map(msg => msg.content).join('\n');
    const userAssistantMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant') as Array<{role: 'user' | 'assistant', content: string}>;
  const res: Anthropic.Messages.Message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    system: systemPrompt,
    messages: userAssistantMessages.map(msg => ({role: msg.role, content: msg.content})),
    temperature: temperature,
    top_p: 1,
    max_tokens: 4096,
  });
  const message: LlmMessage = { role: res.role, content: res.content[0].text };
  console.log('response:', JSON.stringify(message));
  return message;
}

class JsonValidationError extends Error {
  messages: LlmMessage[];

  constructor(message: string, messages: LlmMessage[]) {
    super(message);
    this.name = "JsonValidationError";
    this.messages = messages;
  }
}


/**
 * @param messages - The messages to send to LLM, must be an array of {role, content} objects.
 * @param jsonValidator - A function that returns true if the JSON is valid. Throws an error if the JSON is invalid.
 * @param temperature - The temperature to use for the LLM query, must be between 0 and 1.
 * @param err - An error from a previous run if run inside asyncRetry.
 * @returns A promise that resolves to a message object.
 * @throws If the LLM errors out or if the json response is invalid.
 */
async function queryLlmWithJsonValidation(
  messages: LlmMessage[], 
  jsonValidator: (json: any) => boolean, 
  model: 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307', 
  temperature: number = 0, 
  customError: JsonValidationError | null = null): Promise<LlmMessage> {
    if (customError && customError.messages) {
      messages = messages.concat(customError.messages);
    }
    console.log('queryLlmWithJsonValidation:', JSON.stringify(messages));
    const systemPrompt = messages.filter(msg => msg.role === 'system').map(msg => msg.content).join('\n');
    const userAssistantMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant') as Array<{role: 'user' | 'assistant', content: string}>;
    const res: Anthropic.Messages.Message = await anthropic.messages.create({
      // model: 'gpt-4-0125-preview',
      model: model,
      system: systemPrompt,
      messages: userAssistantMessages.map(msg => ({role: msg.role, content: msg.content})),
      temperature: temperature,
      top_p: 1,
      max_tokens: 4096,
    });
    console.log(JSON.stringify(res));
    const jsonContent = jsonExtractor(res.content[0].text || '');
    const message: LlmMessage = { role: res.role, content: jsonContent};
    console.log('response:', JSON.stringify(message));
    try {
      const json = JSON.parse(message.content);
      if (jsonValidator(json)) {
        return message;
      } else {
        throw new JsonValidationError('Invalid JSON response', [message]);
      }
    } catch (error) {
      if (error instanceof Error) {
        const augmentedError = new JsonValidationError(`Error: ${error.message}`, [message, {role: 'user', content: `Error: ${error.message}`}]);
        console.error(augmentedError);
        throw augmentedError;
      } else {
        throw new JsonValidationError('An unknown error occurred', []);
      }
    }
}

const jsonExtractor = (responseContent: string) => {
  return responseContent.split('```json\n')[1]?.split('\n```')[0]?.trim() || responseContent;
}

export { queryLlm, queryLlmWithJsonValidation };

