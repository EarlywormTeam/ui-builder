export interface EffectConfig {
  deps: string[],
  actions: Array<{actionName: string, actionPayload: any, contextId: string}>,
}

export interface FunctionConfig {
  args: Array<ProviderDependencyConfig>,
  body: string,
}

export interface ProviderDependencyConfig {
  contextId: string,
  selector: string[],
  modifier: FunctionConfig | null,
}

export interface ComponentConfig {
  type: string,
  attributes: Record<string, string | FunctionConfig>,
  events: Array<{name: string, actions: [{actionName: string, actionPayload: string | FunctionConfig | null, contextId: string}]}>,
}

export interface ProviderConfig {
  name: string,
  actions: Array<{name: string, reducerCode: string}>,
  initialState: any,
}

export interface ListConfig {
  generator: FunctionConfig,
  listReusableChildConfig: ProviderConfig | ComponentConfig, 
}

export interface ConditionalConfig {
  condition: Function,
  true: ProviderConfig | ComponentConfig | ListConfig | ConditionalConfig,
  false: ProviderConfig | ComponentConfig | ListConfig | ConditionalConfig,
}

