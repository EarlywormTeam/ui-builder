import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import prettier from 'prettier/standalone';
import { Label } from 'src/components/ui/label';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, type CarouselApi, CarouselPrevious } from 'src/components/ui/carousel';
import { RootState } from 'src/redux/store';
import { ComponentConfig } from './ir/good/config';
import CodeEditor from './CodeEditor';
import { add } from 'src/redux/slice/canvasSlice';

const configLabelExtractor = (config: ComponentConfig): string => {
  return config.type;
}

const formatCode = async (code: string): Promise<string> => {
  const options = {
    parser: "babel",
    semi: false,
    singleQuote: true,
    plugins: ['babel-ts'], // Using the Babel parser
  };

  try {
    const formatted = await prettier.format(code, options);
    return formatted;
  } catch (error) {
    console.error('Error formatting code:', error);
    return code; // Return the original code if formatting fails
  }
}

const generateCodeForConfig = (config: ComponentConfig) => {
  const { type, attributes } = config;
  let attributeString = '';
  const isDivType = type.toLowerCase() === 'div';
  const Type = isDivType ? 'div' : type.charAt(0).toUpperCase() + type.slice(1); // Capitalize the first letter of type if not div
  let importsString = `import React from 'react';\n`;
  if (!isDivType) {
    importsString += `import { ${Type} } from '@/ui/components/${Type}';\n`;
  }
  
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string') {
      attributeString += ` ${key}="${value}"`;
    } else if (typeof value === 'object') {
      // Assuming value can be an object for complex attributes, handle accordingly
      const complexValue = JSON.stringify(value).replace(/"/g, "'");
      attributeString += ` ${key}='${complexValue}'`;
    }
  }
  
  const componentString = isDivType ? 
    `${importsString}\nconst ${Type}Component: React.FC<{ children: React.ReactNode }> = ({ children }) => (\n  <${Type}${attributeString}>{children}</${Type}>\n);\n\nexport default ${Type}Component;` :
    `${importsString}\ninterface ${Type}Props {\n  children: React.ReactNode;\n}\n\nconst ${Type}Component: React.FC<${Type}Props> = ({ children }) => (\n  <${Type}${attributeString}>{children}</${Type}>\n);\n\nexport default ${Type}Component;`;
  
  return componentString;
}

const ComponentCodeEditor = () => {
  const configs = useSelector((state: RootState) => Object.keys(state.canvas.selectedIds).filter(id => state.canvas.selectedIds[id]).filter(id => 'attributes' in state.canvas.componentState.present.configMap[id]).map(id => ({id: id, config: state.canvas.componentState.present.configMap[id]})) as ({id: string, config: ComponentConfig})[]);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (!api) return;

    setSelectedIndex(api.selectedScrollSnap());
    api.on('select', () => {
      setSelectedIndex(api.selectedScrollSnap());
    })
  }, [api])

  if (!configs.length) {
    return <div className="flex flex-col h-full w-full justify-center items-center">
      <Label className="text-lg font-semibold text-center my-4">Select a component to edit properties.</Label>
    </div>
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden items-center relative">
      <Carousel setApi={setApi} className="w-full justify-center max-w-xs">
        <div className="absolute left-0 top-0 bottom-0 flex items-center">
          <CarouselPrevious/>
        </div>
        <CarouselContent>
          {configs.map((config, index) => {
            const label = configLabelExtractor(config.config);
            return (
              <CarouselItem key={index} className="w-full flex justify-center">
                <Label className="text-lg font-semibold text-center">{label.charAt(0).toUpperCase() + label.slice(1)}</Label>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          <CarouselNext/>
        </div>
      </Carousel>
      <div className="flex flex-col h-full w-full px-2">
        <AsyncCodeDisplay id={configs[selectedIndex].id} config={configs[selectedIndex].config} />
      </div>
    </div>
  )
}

const AsyncCodeDisplay = ({ id, config }: { id: string, config: ComponentConfig }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const updateAttributes = (newAttributes: {key: string, value: string | null}[]) => {
    // convert JSXAttribute to a {key: value} object where value is string or other JSXExpressionContainer value
    const newAttributesObject = newAttributes.filter(attr => attr.value !== null).reduce((acc, attr) => {
      return {...acc, [attr.key]: attr.value};
    }, {});
    dispatch(add({id, config: {...config, attributes: newAttributesObject}}))
  }

  useEffect(() => {
    const generateAndFormatCode = async () => {
      try {
        setLoading(true);
        setError(null);
        const generatedCode = generateCodeForConfig(config);
        const formattedCode = await formatCode(generatedCode);
        setCode(formattedCode);
        setLoading(false);
      } catch (e) {
        setError('Failed to generate or format code');
        setLoading(false);
      }
    };

    generateAndFormatCode();
  }, [config]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <CodeEditor code={code} setCode={setCode} updateAttributes={updateAttributes} />;
};

export default ComponentCodeEditor;