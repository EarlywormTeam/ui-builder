import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/redux/store';
import { deleteSelected } from 'src/redux/slice/canvasSlice';
import ComponentMenu from './components/ComponentMenu'; // Your component menu component
import Canvas from './components/Canvas'; // Your canvas component
import ComponentMap from './components/ComponentMap';
import Toolbar from './components/Toolbar';
import { setSelectedIds } from 'src/redux/slice/canvasSlice';

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
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full w-1/4">
          <ComponentMap />
        </div>
        <div className="flex h-full w-full">
          <Canvas isPreview={isPreview} />
        </div>
        <div className="flex h-full w-1/4 gap-4">
          <ComponentMenu />
        </div>
      </div>
    </div>
  )
}

export default AppInternal;