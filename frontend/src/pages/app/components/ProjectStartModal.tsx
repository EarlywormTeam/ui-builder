import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { useDispatch } from 'react-redux';
import { genStarterTemplate } from '../../../redux/slice/canvasSlice';

const ProjectStartModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [projectDescription, setProjectDescription] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    // Automatically open the modal when the app starts
    setIsModalOpen(true);
  }, []);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="hidden">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>What do you want to build?</DialogTitle>
        <DialogDescription>
          Enter a brief description of your project to get started with an AI-generated template, or just freestyle.
        </DialogDescription>
        <Label htmlFor="project-description">Project Description</Label>
        <Textarea
          id="project-description"
          placeholder="Describe your project here..."
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
        />
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Freestyle</Button>
          <Button 
            variant="default" 
            disabled={!projectDescription.trim()} 
            onClick={() => {
              // Logic to handle "Start" action
              setIsModalOpen(false);
              dispatch(genStarterTemplate({ projectDescription: projectDescription.trim() }));
            }}
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