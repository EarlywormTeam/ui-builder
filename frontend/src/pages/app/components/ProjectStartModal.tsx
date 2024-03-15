import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { genStarterTemplate } from '../../../redux/slice/canvasSlice';
import { RootState } from 'src/redux/store';

const ProjectStartModal = () => {
  const projectDescription = useSelector((state: RootState) => state.canvas.projectDescription);
  const presentedRef = useRef(projectDescription !== null);
  const [localProjectDescription, setLocalProjectDescription] = useState('');
  const dispatch = useDispatch();

  const closeModal = () => {
    dispatch(genStarterTemplate({projectDescription: localProjectDescription}))
    // setIsModalOpen(false);
    presentedRef.current = true;
  }

  return (
    <Dialog defaultOpen={!presentedRef.current} open={!presentedRef.current} onOpenChange={() => closeModal()}>
      <DialogContent>
        <DialogTitle>What do you want to build?</DialogTitle>
        <DialogDescription>
          Enter a brief description of your project to get started with an AI-generated template, or just freestyle.
        </DialogDescription>
        <Label htmlFor="project-description">Project Description</Label>
        <Textarea
          id="project-description"
          placeholder="Describe your project here..."
          value={localProjectDescription}
          onChange={(e) => setLocalProjectDescription(e.target.value)}
        />
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => closeModal()}>Freestyle</Button>
          <Button 
            variant="default" 
            disabled={!localProjectDescription.trim()} 
            onClick={() => closeModal()}
          >
            Start
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    // Rest of your App component
  );
};

export default ProjectStartModal;