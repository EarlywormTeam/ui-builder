import { ComponentConfig } from "@/pages/app/components/ir/good/config";
import { type CanvasComponentState } from "./canvasSlice";
import { getComponentName } from "src/pages/app/components/ir/good/useComponent";
import { type FunctionConfig } from "src/pages/app/components/ir/good/config";

async function generateCode(state: CanvasComponentState): Promise<string> {
  const { configMap, parentMap, childrenMap } = state;
  
  // 1. Generate leaf child code
  const secondaryLeafNodeIds = locateSecondaryLeafNodeIds(parentMap, childrenMap);


  // 2. Generate provider code

  // 3. Generate complex component code (heuristic to determine complexity)

  // 4. Generate app code

  // 5. Generate setup script

  // 6. Zip & bundle

  return ""
}

// leaf node will have a key in parent map but no key in children map.
function locateSecondaryLeafNodeIds(parentMap: Record<string, string>, childrenMap: Record<string, string[]>) {
  const leafNodeIds = new Set<string>();
  for (const nodeId of Object.keys(parentMap)) {
    if (!Object.keys(childrenMap).includes(nodeId)) {
      leafNodeIds.add(nodeId);
    }
  }
  for (const [nodeId, children] of Object.entries(childrenMap)) {
    if (children.length === 0) {
      leafNodeIds.add(nodeId);
    }
  }

  const leafParentIds = new Set<string>();
  for (const leafId of leafNodeIds) {
    const parentId = parentMap[leafId]
    if (parentId) {
      leafParentIds.add(parentId);
    }
  }
  return leafParentIds;
}

async function _generateCode(nodeId: string, config: ComponentConfig, children: [{id: string, config: ComponentConfig}]) {

  const childImports = children.map(({id, config}) => {
    const name = getComponentName(config.type);
    return `import {${name}} from '#${id}#';`
  }).join('\n');

  const attributeFunctions = Object.entries(config.attributes)
    .filter((a): a is [string, FunctionConfig] => typeof a[1] !== 'string');
  const attributeStrings = Object.entries(config.attributes)
    .filter((a): a is [string, string] => typeof a[1] === 'string');
  const attributes = attributeStrings.map(obj => `${Object.keys(obj)[0]}=${Object.values(obj)[0]}`).join(' ');
  // const eventFunctions = Object.entries(config.events)
  //   .filter((a): a is [string, { name: string; actions: [{ actionName: string; actionPayload:  FunctionConfig; contextId: string; }]; }] => typeof a[1] !== 'string');
  // const eventStrings = Object.entries(config.events)
  //   .filter((a): a is [string, {name: string; actions: [{actionName: string; actionPayload: string | null; contextId: string;}]}] => typeof a[1] === 'string');
  // const events = eventStrings.map(obj => `${obj[0]}={(e) => {${obj[1]}}`).join(' ');

  const typeName = getComponentName(config.type);
  // Manage function configs for attributes & events


  return `
  ${childImports}



  function #${nodeId}#() {
    return (
      <${typeName} ${attributes} >
      
      </${typeName}>
    )
  }
  `.trim();
}

export default generateCode;