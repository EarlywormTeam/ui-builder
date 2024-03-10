export interface EffectConfig {
  deps: string[],
  actions: Array<{actionName: string, actionPayload: any, contextId: string}>,
}

export interface ProviderDependencyConfig {
  contextId: string,
  selector: string,
  modifier: string | null,
}

export interface ComponentConfig {
  type: string,
  attributes: Record<string, string | ProviderDependencyConfig>,
  events: Array<{name: string, actions: [{actionName: string, actionPayload: any, contextId: string}]}>,
  // effects: Array<EffectConfig>,
}

export interface ProviderConfig {
  name: string,
  actions: Array<{name: string, payload: any, reducerCode: string}>,
  initialState: any,
}

export interface ConfigTree {
  id: string
  config: ComponentConfig | ProviderConfig
  children: ConfigTree[]
}