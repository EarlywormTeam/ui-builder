import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/redux/store';
import { deleteSelected } from 'src/redux/slice/canvasSlice';
import ComponentMenu from './components/ComponentMenu'; // Your component menu component
import Canvas from './components/Canvas'; // Your canvas component
import ComponentMap from './components/ComponentMap';
import Toolbar from './components/Toolbar';
import { setSelectedIds } from 'src/redux/slice/canvasSlice';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'src/components/ui/resizable';
import PropertyEditor from './components/PropertyEditor';
import ComponentCodeEditor from './components/ComponentCodeEditor';

const useIsTextEditing = () => {
  const textEditingId = useSelector((state: RootState) => state.canvas.textEditingId);
  return textEditingId !== null;
}

const AppInternal = ({isPreview, setIsPreview}: {isPreview: boolean, setIsPreview: React.Dispatch<React.SetStateAction<boolean>>}) => {
  const dispatch = useDispatch();
  const isTextEditing = useIsTextEditing();

  useEffect(() => {
    if (isPreview) {
      dispatch(setSelectedIds([]));
    }
  }, [dispatch, isPreview]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' && !isTextEditing) {
        dispatch(deleteSelected());
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, isTextEditing]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <Toolbar isPreview={isPreview} setIsPreview={setIsPreview} />
      <ResizablePanelGroup direction='horizontal' className='flex h-full w-full overflow-hidden'>
        <ResizablePanel className="flex h-full w-full" minSize={10} maxSize={15} defaultSize={15} collapsible={true} collapsedSize={2}>
          <ComponentMap />
        </ResizablePanel>
        <ResizableHandle/>
        <ResizablePanel className="flex h-full w-full" minSize={25} maxSize={100} defaultSize={65}>
          <Canvas isPreview={isPreview} />
        </ResizablePanel>
        <ResizableHandle/>
        <ResizablePanel className="flex h-full w-full gap-4" minSize={10} maxSize={35} defaultSize={20} collapsible={true} collapsedSize={2}>
          <ResizablePanelGroup direction='vertical' className='flex h-full w-full overflow-hidden'>
            <ResizablePanel className="flex h-full w-full overflow-y-auto" minSize={15} maxSize={98} defaultSize={70} collapsedSize={2} collapsible={true}>
              <ComponentMenu />
            </ResizablePanel>
            <ResizableHandle/>
            <ResizablePanel className="flex h-full w-full" minSize={15} maxSize={98} defaultSize={30} collapsedSize={2} collapsible={true}>
              <ComponentCodeEditor />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        </ResizablePanelGroup>
    </div>
  )
}

export default AppInternal;