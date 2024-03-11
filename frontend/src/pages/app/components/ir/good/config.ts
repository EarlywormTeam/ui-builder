export interface EffectConfig {
  deps: string[],
  actions: Array<{actionName: string, actionPayload: any, contextId: string}>,
}

export interface ModifierFunction {
  body: string,
}

export interface ProviderDependencyConfig {
  contextId: string,
  selector: string[],
  modifier: ModifierFunction | null,
}

export interface ComponentConfig {
  type: string,
  attributes: Record<string, string | ProviderDependencyConfig>,
  events: Array<{name: string, actions: [{actionName: string, actionPayload: string | ModifierFunction | null, contextId: string}]}>,
}

export interface ProviderConfig {
  name: string,
  actions: Array<{name: string, reducerCode: string}>,
  initialState: any,
}

// You will have a provider with a hook into a lookup table for id -> config.
