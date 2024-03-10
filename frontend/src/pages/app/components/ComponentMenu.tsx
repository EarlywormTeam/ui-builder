import { DynamicElement } from "./ir/good/DynamicElement";

const ComponentMenu = () => {
  const dragEnabled = true;
  const dropEnabled = false;
  const components = ['rowLayout', 'colLayout', 'label', 'button', 'input', 'textArea']
  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-4 gap-3 bg-gray-100">
        {components.map((component) => (
          <DynamicElement
            id={component + "__demo"}
            key={component + "__demo"}
            draggable={dragEnabled}
            droppable={dropEnabled}
          />
        ))}
    </div>
  );
};

export default ComponentMenu;
