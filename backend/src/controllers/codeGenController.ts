import { Context } from 'koa';
import * as LLM from '../services/llm';
import { ComponentConfig, ProviderConfig } from '../types/config';

interface ConfigTree {
  id: string
  config: ComponentConfig | ProviderConfig
  children: ConfigTree[]
}

export const doMagicWiring = async (ctx: Context) => {
  const { configTree } = ctx.request.body as {configTree: ConfigTree};
  const messages: LLM.LlmMessage[] = [{role: "system", content: magicWiringSystemPrompt}, {role: "user", content: JSON.stringify(magicWiringExampleOne)}, {role: "assistant", content: JSON.stringify(magicWiringSolutionOne)}, {role: "user", content: JSON.stringify(configTree)}];
  const resMessage = await LLM.queryLlmWithJsonValidation(messages, (json) => true);
  ctx.body = {configTree: JSON.parse(resMessage.content)};
}

// TODO - improve validation
const configTreeJsonValidation = (json: any) => {
  if (typeof json !== "object") {
    throw new Error("Invalid input: Expected an object.");
  }

  if (!json.id || !json.config || !json.children) {
    throw new Error("Invalid config tree: Missing required fields (id, config, children).");
  }
  
  for (const child of json.children) {
    configTreeJsonValidation(child); // This will throw an error if validation fails
  }

  const componentConfigKeys = ['type', 'attributes', 'events'];
  const providerConfigKeys = ['name', 'actions', 'initialState'];

  const isComponentConfig = componentConfigKeys.every(key => key in json.config);
  const isProviderConfig = providerConfigKeys.every(key => key in json.config);

  if (!isComponentConfig && !isProviderConfig) {
    throw new Error("Invalid config: Config does not match ComponentConfig or ProviderConfig structure.");
  }

  return true;
};

const magicWiringSystemPrompt = `You are a software architect at a top tier company and you are developing a web application that uses react and redux design principles. Your team has put together the first draft of a new website in a json format. Your job is to help wire up the existing components using context providers, actions, reducer code, dom events, and react effects.

The user will share with you the existing design and you will fill in the missing pieces and return it back to the user. You must follow the json format.

There are 2 types of configs you will deal with. Your configs must conform to one of the two interfaces below depending on the role of the node. Note that you will have to use ProviderConfig in order to wire up state. A Provider config creates a context/provider pair on the frontend. It's purely a way to manage state and does not impact the dom. ComponentConfigs do impact the dom and are directly tied to a certain type of component, identified by the "type" field.

Always create new ids for new nodes. Do NOT reuse ids. For example, if you are adding a provider, do not reuse the id of a div or any other component. Generate a new id for the provider.

Sometimes no work is required and in that case you may return an empty string to signify no work is necessary.

\`\`\`json
export interface ComponentConfig {
  type: string,
  attributes: Record<string, string | ProviderDependencyConfig>,
  events: Array<{name: string, actions: [{actionName: string, actionPayload: any, contextId: string}]}>,
}

export interface ProviderConfig {
  name: string,
  actions: Array<{name: string, payload: any, reducerCode: string}>,
  initialState: any,
}

// Helper interface
interface ProviderDependencyConfig {
  contextId: string,
  selector: string[],
  modifier: {
    args: string[],
    body: string,
  } | null,
}
\`\`\

The interface for the ConfigTree is:
\`\`\`json
interface ConfigTree {
  id: string
  config: ComponentConfig | ProviderConfig
  children: ConfigTree[]
}
\`\`\`

**IMPORTANT**: canvas is a reserved id for the root node. Do NOT use it as an id for any other node.`

const magicWiringExampleOne = {
  "id": "root",
  "config": {
    "type": "div",
    "attributes": {},
    "events": [],
  },
  "children": [
    {
      "id": "1",
      "config": {
        "type": "button",
        "attributes": {"textContent": "+"},
        "events": [],
      },
      "children": [],
    },
    {
      "id": "2",
      "config": {
        "type": "label",
        "attributes": {"textContent": "0"},
        "events": [],
      },
      "children": [],
    },
    {
      "id": "3",
      "config": {
        "type": "button",
        "attributes": {"textContent": "-"},
        "events": [],
      },
      "children": [],
    },
  ],
};

const magicWiringSolutionOne = {
  "id": "root",
  "config": {
    "type": "div",
    "attributes": {},
    "events": [],
  },
  "children": [
    {
      "id": "1",
      "config": {
        "name": "Counter",
        "actions": [
          {
            "name": "increment",
            "payload": null,
            "reducerCode": "return { ...state, count: state.count + 1 };"
          },
          {
            "name": "decrement",
            "payload": null,
            "reducerCode": "return { ...state, count: state.count - 1 };"
          }
        ],
        "initialState": {
          "count": 0
        }
      },
      "children": [
        {
          "id": "2",
          "config": {
            "type": "button",
            "attributes": {"textContent": "+"},
            "events": [
              {
                "name": "onClick",
                "actions": [
                  {
                    "actionName": "increment",
                    "actionPayload": null,
                    "contextId": "1"
                  }
                ]
              }
            ],
          },
          "children": []
        },
        {
          "id": "3",
          "config": {
            "type": "label",
            "attributes": {
              "textContent": 
              {
                "contextId": "1",
                "selector": ['count'],
                "modifier": {
                  args: ['count'],
                  body: 'return count.toString();'
                }
              }
            },
            "events": [],
          },
          "children": []
        },
        {
          "id": "4",
          "config": {
            "type": "button",
            "attributes": {"textContent": "-"},
            "events": [
              {
                "name": "onClick",
                "actions": [
                  {
                    "actionName": "decrement",
                    "actionPayload": null,
                    "contextId": "1"
                  }
                ]
              }
            ],
          },
          "children": []
        } 
      ]
    }
  ]
};
