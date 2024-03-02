import { DndContext } from '@dnd-kit/core';
import ComponentMenu from './components/ComponentMenu'; // Your component menu component
import Canvas from './components/Canvas'; // Your canvas component

const App = () => {
  return (
    <DndContext>
      <div className="flex h-screen">
        <div className="flex-1">
          <Canvas />
        </div>
        <div className="w-1/4">
          <ComponentMenu />
        </div>
      </div>
    </DndContext>
  );
};

export default App;
