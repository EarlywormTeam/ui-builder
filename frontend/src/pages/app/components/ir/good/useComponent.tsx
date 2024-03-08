import { RowLayout, ColLayout } from 'src/components';
import { Label, Button } from 'src/components/ui';


const componentMap: Record<string, React.FC<any>> = {
  row: RowLayout,
  col: ColLayout,
  label: Label,
  button: Button,
};

export function useComponent(type: string) {
  const Comp = componentMap[type];
  if (!Comp) {
    console.error(`Component ${type} not found`);
    return null;
  }

  return Comp;
}

