import * as Claude from './claude';
import * as OpenAI from './openai';
import { LlmMessage } from './types';

/**
 * @param messages - The messages to send to LLM, must be an array of {role, content} objects.
 * @param temperature - The temperature to use for the LLM query, must be between 0 and 1.
 * @returns A promise that resolves to a message object.
 * @throws If the LLM errors out.
 */
async function queryLlm(provider: 'openai' | 'claude', messages: LlmMessage[], temperature: number = 0): Promise<LlmMessage> {
  switch (provider) {
    case 'openai':
      return OpenAI.queryLlm(messages, temperature);
    case 'claude':
      return Claude.queryLlm(messages, temperature);
    default:
      throw new Error(`Invalid provider: ${provider}`);
  }
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
  provider: 'openai' | 'claude',
  messages: LlmMessage[], 
  jsonValidator: (json: any) => boolean, 
  model: 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' | 'gpt-4-0125-preview' | 'gpt-3.5-turbo-0125', 
  temperature: number = 0, 
  customError: JsonValidationError | null = null): Promise<LlmMessage> {
  switch (provider) {
    case 'openai':
      const openAIModel = model as 'gpt-4-0125-preview' | 'gpt-3.5-turbo-0125';
      return OpenAI.queryLlmWithJsonValidation(messages, jsonValidator, openAIModel, temperature, customError);
    case 'claude':
      const claudeModel = model as 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';
      return Claude.queryLlmWithJsonValidation(messages, jsonValidator, claudeModel, temperature, customError);
    default:
      throw new Error(`Invalid provider: ${provider}`);
  }
}

export { LlmMessage, queryLlm, queryLlmWithJsonValidation };

