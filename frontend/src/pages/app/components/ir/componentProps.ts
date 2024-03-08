// export interface ComponentProps {
//   name: string | null;
//   type: string;
//   children: Array<ComponentProps> | string;
//   id: string;
//   attributes: Array<{ name: string; value: string }>;
//   events: Array<{ name: string, actionName: string, actionPayload: string | null }>;
//   effectDependency: Array<{dependencyName: string, actionName: string, actionPayload: string | null }>;
// }
// export const formatAttributes = (attributes: Array<{ name: string; value: string }>) => {
//   return attributes.map(attr => `${attr.name}="${attr.value}"`);
// };

// export const formatEvents = (events: Array<{ name: string; actionName: string; actionPayload: string | null }>) => {
//   return events.map(event => `${event.name}={() => this.${event.actionName}(${event.actionPayload ? JSON.stringify(event.actionPayload) : ''})}`);
// };

// export const convertToReactCode = (component: ComponentProps | string): string => {
//   if (typeof component === 'string') {
//     return component; // Directly return the string if the component is a text node
//   }

//   const { type, children, id, attributes, events, effectDependency } = component;
//   const attributesString = formatAttributes(attributes).join(' ');
//   const eventsString = formatEvents(events).join(' ');
//   const childrenString = Array.isArray(children) ? children.map(child => convertToReactCode(child)).join('\n') : children;

//   // Construct the component string
//   const componentString = `<${type.charAt(0).toUpperCase() + type.slice(1)} id="${id}" ${attributesString} ${eventsString}>
//   ${childrenString}
// </${type.charAt(0).toUpperCase() + type.slice(1)}>`;

//   return componentString;
// };

export {}