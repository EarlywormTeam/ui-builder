import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/redux/store';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { Switch } from 'src/components/ui/switch';
import { undo, redo, downloadCode } from 'src/redux/slice/canvasSlice';
import { startMagicPaint, startMagicWiring } from 'src/redux/slice/loadingSlice';


interface ToolbarProps {
  isPreview: boolean;
  setIsPreview: (isPreview: boolean) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({isPreview, setIsPreview}) => {
  const dispatch = useDispatch();
  const canUndo = useSelector((state: RootState) => state.canvas.componentState.past.length) > 0;
  const canRedo = useSelector((state: RootState) => state.canvas.componentState.future.length) > 0;
  const magicWiringLoading = useSelector((state: RootState) => state.loading.magicWiringLoading);
  const magicPaintingLoading = useSelector((state: RootState) => state.loading.magicPaintingLoading);

  return (
    <div className="top-toolbar flex justify-between items-center p-2 bg-gray-100 border-b">
      <Label className="text-lg items-center text-center p-2 bg-gray-950 text-gray-50">qckfx</Label>
      <div className="action-buttons flex gap-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="display-mode">Edit</Label>
          <Switch id="display-mode" onCheckedChange={(checked) => setIsPreview(checked)} />
          <Label htmlFor="display-mode">Preview</Label>
        </div>
        <Button
              variant={'default'}
              onClick={() => dispatch(startMagicPaint())}
              disabled={magicWiringLoading || magicPaintingLoading} // Disable button when loading
            >
              {magicPaintingLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <img src={process.env.PUBLIC_URL + "/paintbrush.svg"} alt="AI Magic Painting" style={{width: '100%', height: '100%', objectFit: 'contain'}} /> 
              )}
            </Button>
        <Button 
              variant={'default'} 
              onClick={() => dispatch(startMagicWiring())}
              disabled={magicWiringLoading || magicPaintingLoading} // Disable button when loading
            >
              {magicWiringLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <img src={process.env.PUBLIC_URL + "/magic.svg"} alt="AI Magic Coding" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
              )}
            </Button>
      </div>
      <div className="undo-redo-buttons flex gap-2">
        <Button variant={'default'} disabled={!canUndo} onClick={(e) => dispatch(undo())}>
          <img src={process.env.PUBLIC_URL + "/undo.svg"} alt="Undo" style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
        </Button>
        <Button variant={'default'} disabled={!canRedo} onClick={(e) => dispatch(redo())}>
          <img src={process.env.PUBLIC_URL + "/redo.svg"} alt="Redo" style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
        </Button>
        <Button variant={'outline'} onClick={(e) => dispatch(downloadCode())}>
          <img src={process.env.PUBLIC_URL + "/download.svg"} alt="Download Code" style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
        </Button>
      </div>
    </div>
  )
}

export default Toolbar;