import { DynamicElement } from "./ir/good/DynamicElement";

const ComponentMenu = () => {
  const dragEnabled = true;
  const dropEnabled = false;
  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-4 gap-3 bg-gray-100">
        <DynamicElement
          id="rowLayout__demo"
          draggable={dragEnabled}
          droppable={dropEnabled}
        />
        {/* <RowLayout id="rowLayout">Row Layout</RowLayout> */}
        <DynamicElement
          id="colLayout__demo"
          draggable={dragEnabled}
          droppable={dropEnabled}
        />
        {/* <ColLayout id="colLayout">Column Layout</ColLayout> */}
        <DynamicElement
          id="label"
          draggable={dragEnabled}
          droppable={dropEnabled}
        />
        {/* <Label>Label</Label> */}
        <DynamicElement
          id="button"
          draggable={dragEnabled}
          droppable={dropEnabled}
        />
        {/* <Button>Button</Button> */}
    </div>
  );
};

export default ComponentMenu;
