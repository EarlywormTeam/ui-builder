
import React from 'react';
import withDroppable from './DroppableComponent';
import { DynamicElement } from './ir/good/DynamicElement';
import { useChildrenIds } from 'src/redux/selector';
import { useDispatch } from 'react-redux';
import { setSelectedIds } from 'src/redux/slice/canvasSlice';


const Canvas = ({ isPreview }: { isPreview: boolean }) => {
  const dispatch = useDispatch();
  const childrenIds = useChildrenIds('canvas');

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    dispatch(setSelectedIds([]));
  }

  const CanvasContent = React.forwardRef<HTMLDivElement, React.PropsWithChildren<{}>>(({ children, ...props }, ref) => (
    <div ref={ref} onClick={onClick} className="flex w-full h-full align-items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 p-2" {...props}>
      {children}
    </div>
  ));

  const DroppableCanvasContent = withDroppable(CanvasContent);

  return (
    <DroppableCanvasContent id='canvas'>
      {childrenIds.length > 0 ? childrenIds.map((id: string) => 
      <DynamicElement id={id} key={id} draggable={!isPreview} droppable={!isPreview} mode={isPreview ? 'preview' : 'editing'} />
    ) : <p>No components to display</p>}
    </DroppableCanvasContent>
  );
};

export default Canvas;
