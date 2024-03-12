import { Context } from 'koa';
import * as LLM from '../../services/llm';

export const genStarterTemplate = async (ctx: Context) => {
  const { projectDescription } = ctx.request.body as {projectDescription: string};
  const messages: LLM.LlmMessage[] = [{role: "system", content: magicPaintSystemPrompt}, {role: "user", content: "An up down counter application."}, {role: "assistant", content: JSON.stringify(upDownCounterSample)}, {role: "user", content: "A form with required name and email fields. Email must be valid (contain an '@' character). There's a submit button."}, {role: "assistant", content: JSON.stringify(nameAndEmailFormSample)}, {role: "user", content: 'A todo list app'}, {role: 'assistant', content: JSON.stringify(todoListSample)}, {role: "user", content: projectDescription}];
  const resMessage = await LLM.queryLlmWithJsonValidation(messages, (json) => true, 'gpt-4-0125-preview');
  console.log(JSON.stringify(JSON.parse(resMessage.content), null, 2));
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

const magicPaintSystemPrompt = `You are a senior staff software prototyper at a top tier company and you are designing a web application that uses react, open source component libraries, and tailwind css. You receive project ideas and descriptions and create a json tree that represents the design of the website.

The user will share with you their idea and you will reply with the json-formatted configuration for their website. You must follow the json format described below.

When designing the site, consider spacing, size of elements, responsive design, color scheme, etc when making your edits. Consider the overall picture and how elements will look alongside one another. You may need to add new elements like divs to the tree to achieve your desired affect.

Try to use existing variants and sizes where possible. Be cautious of setting individual classNames and ensure that your choices will merge with the chosen or default variant and size properties.

There are 2 types of configs you will deal with. Your configs must conform to one of the two interfaces below depending on the role of the node. Note that you will have to use ProviderConfig in order to wire up state. A Provider config creates a context/provider pair on the frontend.  It's purely a way to manage state and does not impact the dom. ComponentConfigs do impact the dom and are directly tied to a certain type of component, identified by the "type" field.

Always create new ids for new nodes. Do NOT reuse ids. For example, if you are adding a provider, do not reuse the id of a div or any other component. Generate a new id for the provider.

Event actions must have an actionName and a contextId. The actionName must be the name of an action that is available on a context with an id that matches the contextId.

Sometimes no work is required and in that case you may return an empty string to signify no work is necessary.

\`\`\`tsx
// Use functions for string interpolation or running functions.
// For example, if you want to access document.getElementById('todoInput').value
// you can use a modifier like this: 
// {args: [], body: 'return document.getElementById("todoInput").value;'}
// Args are accessible within the function on the variable \`args\`.
// Ror example, the object below would check that a name value from 
// context with id 1 has a length greater than 0.
// {args: [{contextId: '1', selector: ['name'], modifier: null}], body: 'return args[0].length > 0;'}
// FunctionConfig's body always has the listIndex in scope if the FunctionConfig is being executed on the child of a ListConfig. This makes it easy to get the value of the current list item, for example \`{args: [{contextId: '1', selector: ['todos'], modifier: null}], body: 'return args[0][listIndex];'}\` will give you the value of a todo in a list of todos.
interface FunctionConfig {
  args: Array<ProviderDepenendencyConfig>,
  body: string,
}

// Example of event names: onClick, onBlur, onMouseDown, onKeyDown, etc.
// Example of attributes: classname, textcontent, type, value, defaultValue, placeholder, etc.
export interface ComponentConfig {
  type: 'button' | 'label' | 'textarea' | 'div' | 'input',
  attributes: Record<string, string | FunctionConfig>,
  events: Array<{name: string, actions: [{actionName: string, actionPayload: string | FunctionConfig | null}]}>, // FunctionConfig.body can access the event object through variable \`event\`.
}

export interface ProviderConfig {
  name: string,
  actions: Array<{name: string, reducerCode: string}>, // **IMPORTANT** do not place ';' semicolons inside of json objects where you should use ',' instead.
  initialState: any,
}

// A ListConfig is an abstract object that generates children. 
// It should usually be wrapped in a container div to hold the components it generates.
export interface ListConfig {
  generator: FunctionConfig, // this should return a list of data that will be used to generate the list of nodes
  listReusableChildConfig: ProviderConfig | ComponentConfig, // we will map over the output of the generator and return one config for every item from the generator.
}

// Helper interface
interface ProviderDependencyConfig {
  contextId: string, // must match the id of a node with a ProviderConfig
  selector: string[], // if accessing user.name then this would be ['user', 'name']
  modifier: FunctionConfig | null, // FunctionConfig.body can access the value from the context through the variable \`value\`.
}
\`\`\

The interface for the ConfigTree is:
\`\`\`json
interface ConfigTree {
  id: string // must be unique
  config: ComponentConfig | ProviderConfig | ListConfig
  children: ConfigTree[]
}
\`\`\`

**IMPORTANT**: The 'canvas' id is reserved for the root node. Do not alter this node and do not reuse the 'canvas' id anywhere in your config.

Do NOT set values to be the width or height of the screen. Use h-full or w-full instead.

Synchronize text inputs with a context provider's state. Do NOT use \`value\` without an \`onChange\` event handler, or else the input will be read-only.

You are using components from the shadcn library. You have available the following components: 
- button
- label
- textarea
- div
- input

\`\`\`jsx
// These are the variants for the \`button\` type in the config tree.
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90",
        destructive:
          "bg-red-500 text-slate-50 shadow-sm hover:bg-red-500/90 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90",
        outline:
          "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        secondary:
          "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
\`\`\`

\`\`\`jsx
// This is the default style for the \`label\` type in the config tree.
"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
\`\`\`

\`\`\`jsx
// These is the default style for the \`textarea\` type in the config tree.
"flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
\`\`\`

\`\`\`
// This is the default style for the \`input\` type in the config tree.
"flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
\`\`\``

const upDownCounterSample = {
  "id": "root",
  "config": {
    "type": "div",
    "attributes": {"className": "flex justify-center items-center h-full bg-gray-100"},
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
            "reducerCode": "return { ...state, count: state.count + 1 };"
          },
          {
            "name": "decrement",
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
            "attributes": {"textcontent": "+", "variant": "default", "size": "sm"},
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
            "type": "div",
            "attributes": {
              "className": "flex justify-center items-center p-4"
            },
            "events": []
          },
          "children": [
            {
              "id": "4",
              "config": {
                "type": "label",
                "attributes": {
                  "textcontent": 
                  {
                    'args': [{
                      "contextId": "1",
                      "selector": ['count'],
                      "modifier": null,
                    }],
                    'body': 'return args[0].toString();'
                  },
                  "className": "text-4xl"
                },
                "events": [],
              },
              "children": []
            }
          ]
        },
        {
          "id": "5",
          "config": {
            "type": "button",
            "attributes": {"textcontent": "-", "variant": "destructive", "size": "sm"},
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

const nameAndEmailFormSample = {
  "id": "canvas",
  "children": [
    {
      "id": "root",
      "config": {
        "name": "Form",
        "actions": [
          {
            "name": "updateName",
            "reducerCode": "return { ...state, name: action.payload, validName: action.payload.trim().length > 0 };"
          },
          {
            "name": "updateEmail",
            "reducerCode": "return { ...state, email: action.payload, validEmail: action.payload.trim().length > 0 && action.payload.match(/.+@.+/) };"
          },
          {
            "name": "submitForm",
            "reducerCode": "if (state.name && state.email) { alert('Form submitted successfully!'); return { name: '', email: '' }; } else { return state; }"
          }
        ],
        "initialState": {
          "name": "",
          "email": "",
          "validName": false,
          "validEmail": false
        }
      },
      "children": [
        {
          "id": "nameFieldContainer",
          "config": {
            "type": "div",
            "attributes": {
              "className": "w-full max-w-md",
              "textcontent": ""
            },
            "events": []
          },
          "children": [
            {
              "id": "nameLabel",
              "config": {
                "type": "label",
                "attributes": {
                  "textcontent": "Name",
                  "className": "block text-sm font-medium leading-none mb-2"
                },
                "events": []
              },
              "children": []
            },
            {
              "id": "nameInput",
              "config": {
                "type": "input",
                "attributes": {
                  "type": "text",
                  "placeholder": "Your name",
                  "required": "true",
                  "value": {
                    'args': [{
                      "contextId": "root",
                      "selector": ['name'],
                      "modifier": null
                    }],
                    'body': 'return args[0];'
                  }
                },
                "events": [
                  {
                    "name": "onChange",
                    "actions": [
                      {
                        "actionName": "updateName",
                        "actionPayload": {
                          "args": [],
                          "body": "return event.target.value;",
                        },
                        "contextId": "root"
                      }
                    ]
                  }
                ],
                "children": []
              }
            },
            {
              "id": "emailFieldContainer",
              "config": {
                "type": "div",
                "attributes": {
                  "className": "w-full max-w-md",
                  "textcontent": ""
                },
                "events": []
              },
              "children": [
                {
                  "id": "emailLabel",
                  "config": {
                    "type": "label",
                    "attributes": {
                      "textcontent": "Email",
                      "className": "block text-sm font-medium leading-none mb-2"
                    },
                    "events": []
                  },
                  "children": []
                },
                {
                  "id": "emailInput",
                  "config": {
                    "type": "input",
                    "attributes": {
                      "type": "email",
                      "placeholder": "Your email",
                      "required": "true",
                      "pattern": ".+@.+",
                      "value": {
                        'args': [{
                          "contextId": "root",
                          "selector": ['email'],
                          "modifier": null
                        }],
                        'body': 'return args[0];'
                      }
                    },
                    "events": [
                      {
                        "name": "onChange",
                        "actions": [
                          {
                            "actionName": "updateEmail",
                            "actionPayload": {
                              "args": [],
                              "body": "return event.target.value;",
                            },
                            "contextId": "root"
                          }
                        ]
                      }
                    ],
                    "children": []
                  }
                },
                {
                  "id": "comp-s0a1krho4",
                  "config": {
                    "type": "label",
                    "attributes": {
                      "className": {
                        "args": [{
                          "contextId": "root",
                          "selector": null,
                          "modifier": null
                        }],
                        "body": "return state.validName && state.validEmail ? 'hidden' : 'inline';"
                      },
                      "textcontent": "You must provide a valid name and email."
                    },
                    "events": []
                  },
                  "children": []
                },
                {
                  "id": "submitButton",
                  "config": {
                    "type": "button",
                    "attributes": {
                      "textcontent": "Submit",
                      "variant": "default",
                      "size": "default",
                      "type": "submit",
                    },
                    "events": [
                      {
                        "name": "click",
                        "actions": [
                          {
                            "actionName": "submitForm",
                            "actionPayload": null,
                            "contextId": "root"
                          }
                        ]
                      }
                    ],
                    "children": []
                  }
                },
              ]
            }
          ]
        }
      ]
    }
  ]
};

const todoListSample = {
  "id": "canvas",
  "children": [
    {
      "id": "root",
      "config": {
        "name": "TodoList",
        "actions": [
          {
            "name": "addTodo",
            "reducerCode": "if (action.payload.trim() !== '') { return { ...state, todos: [...state.todos, action.payload], newTodo: '' }; } else { return state; }"
          },
          {
            "name": "updateNewTodo",
            "reducerCode": "return { ...state, newTodo: action.payload };"
          },
          {
            "name": "removeTodo",
            "reducerCode": "return { ...state, todos: state.todos.filter((_, index) => index !== action.payload) };"
          }
        ],
        "initialState": {
          "todos": [],
          "newTodo": ""
        }
      },
      "children": [
        {
          "id": "todoInputContainer",
          "config": {
            "type": "div",
            "attributes": {
              "className": "flex space-x-2"
            },
            "events": []
          },
          "children": [
            {
              "id": "todoInput",
              "config": {
                "type": "input",
                "attributes": {
                  "placeholder": "Add a new todo",
                  "value": {
                    "args": [
                      {
                        "contextId": "root",
                        "selector": [
                          "newTodo"
                        ],
                        "modifier": null
                      }
                    ],
                    "body": "return args[0];"
                  }
                },
                "events": [
                  {
                    "name": "onChange",
                    "actions": [
                      {
                        "actionName": "updateNewTodo",
                        "actionPayload": {
                          "args": [],
                          "body": "return event.target.value;"
                        },
                        "contextId": "root"
                      }
                    ]
                  }
                ]
              },
              "children": []
            },
            {
              "id": "addTodoButton",
              "config": {
                "type": "button",
                "attributes": {
                  "textcontent": "Add",
                  "variant": "default",
                  "size": "default"
                },
                "events": [
                  {
                    "name": "onClick",
                    "actions": [
                      {
                        "actionName": "addTodo",
                        "actionPayload": {
                          "args": [
                            {
                              "contextId": "root",
                              "selector": [
                                "newTodo"
                              ],
                              "modifier": null
                            }
                          ],
                          "body": "return args[0];"
                        },
                        "contextId": "root"
                      }
                    ]
                  }
                ]
              },
              "children": []
            }
          ]
        },
        {
          "id": "todoListContainer",
          "config": {
            "type": "div",
            "attributes": {
              "className": "mt-4"
            },
            "events": []
          },
          "children": [
            {
              "id": "todoList",
              "config": {
                "generator": {
                  "args": [
                    {
                      "contextId": "root",
                      "selector": [
                        "todos"
                      ],
                      "modifier": null
                    }
                  ],
                  "body": "return args[0];"
                },
                "listReusableChildConfig": {
                  "type": "div",
                  "attributes": {
                    "className": "flex justify-between items-center p-2 bg-gray-100 rounded mb-2"
                  },
                  "events": [],
                  "children": [
                    {
                      "id": "todoItem",
                      "config": {
                        "type": "label",
                        "attributes": {
                          "textcontent": {
                            "args": [
                              {
                                "contextId": "root",
                                "selector": [
                                  "todos"
                                ],
                                "modifier": null
                              }
                            ],
                            "body": "return args[0][listIndex];"
                          },
                          "className": "text-sm"
                        },
                        "events": []
                      },
                      "children": []
                    },
                    {
                      "id": "removeTodoButton",
                      "config": {
                        "type": "button",
                        "attributes": {
                          "textcontent": "Remove",
                          "variant": "destructive",
                          "size": "sm"
                        },
                        "events": [
                          {
                            "name": "onClick",
                            "actions": [
                              {
                                "actionName": "removeTodo",
                                "actionPayload": {
                                  "args": [],
                                  "body": "return listIndex;"
                                },
                                "contextId": "root"
                              }
                            ]
                          }
                        ]
                      },
                      "children": []
                    }
                  ]
                }
              },
              "children": []
            }
          ]
        }
      ]
    }
  ]
}