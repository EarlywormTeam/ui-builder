import { Div } from 'src/components';
import { Label, Button, Textarea, Input } from 'src/components/ui';


const componentMap: Record<string, React.FC<any>> = {
  div: Div,
  label: Label,
  button: Button,
  textarea: Textarea,
  input: Input,
};

export function useComponent(type: string) {
  const Comp = componentMap[type];
  if (!Comp) {
    console.error(`Component ${type} not found`);
    return null;
  }

  return Comp;
}

