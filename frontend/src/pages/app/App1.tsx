import { useState } from 'react';
import { useSelector } from 'react-redux';
import DragAndDrop from './DragAndDrop';
import AppInternal from './AppInternal';
import { RootState } from 'src/redux/store';
import ProjectStartModal from './components/ProjectStartModal';

const App = () => {
  const [isPreview, setIsPreview] = useState(false);
  const projectTemplateLoading = useSelector((state: RootState) => state.loading.projectTemplateLoading);

  return (
    <>
    <div className={`h-full w-full relative ${projectTemplateLoading ? 'pointer-events-none' : ''}`}>
    {projectTemplateLoading && (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-white"></div>
      </div>
    )}
    <ProjectStartModal/>
      {isPreview ? (
         <AppInternal isPreview={isPreview} setIsPreview={setIsPreview} />
      ) : (
        <DragAndDrop>
          <AppInternal isPreview={isPreview} setIsPreview={setIsPreview} />
        </DragAndDrop>
      )}
      </div>
    </>
  );
}

export default App;