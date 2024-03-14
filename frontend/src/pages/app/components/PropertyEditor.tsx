import { useSelector } from 'react-redux';
import { Label } from 'src/components/ui/label';
import { Input } from 'src/components/ui/input';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, type CarouselApi, CarouselPrevious } from 'src/components/ui/carousel';
import { RootState } from 'src/redux/store';
import { ComponentConfig, FunctionConfig, ListConfig, ProviderConfig } from './ir/good/config';
import { useEffect, useState } from 'react';
import { add, addConfigClassName, removeConfigClassName } from '@/redux/slice/canvasSlice';

const propertyMap: Record<string, Record<string, { type: string, extractor: (classNames: string | FunctionConfig) => string | FunctionConfig | undefined, encoder?: (value: string) => string }>> = {
  'Layout': {
    'Padding': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => className.startsWith('p-'))?.replace('p-', ''),
      encoder: (value) => `p-${value}`,
    },
    'Margin': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => className.startsWith('m-'))?.replace('m-', ''),
      encoder: (value) => `m-${value}`,
    },
    'Width': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => className.startsWith('w-'))?.replace('w-', ''),
      encoder: (value) => `w-${value}`,
    },
    'Height': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => className.startsWith('h-'))?.replace('h-', ''),
      encoder: (value) => `h-${value}`,
    }
  },
  'Typography': {
    'Font Size': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => /^(text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl))$/.test(className))?.replace('text-', ''),
      encoder: (value) => `text-${value}`,
    },
    'Font Weight': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => /^(font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black))$/.test(className))?.replace('font-', ''),
      encoder: (value) => `font-${value}`,
    },
    'Alignment': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => /^(text-(left|center|right|justify|start|end))$/.test(className))?.replace('text-', ''),
      encoder: (value) => `text-${value}`,
    },
    'Color': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => /^(text-(inherit|current|transparent|black|white|[\w-]+-\d+))$/.test(className))?.replace('text-', ''),
      encoder: (value) => `text-${value}`,
    }
  },
  'Backgrounds & Borders': {
    'Background Color': {
      type: 'color',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => className.startsWith('bg-'))?.replace('bg-', ''),
      encoder: (value) => `bg-${value}`,
    },
    'Border Width': {
      type: 'number',
      extractor: (classNames) => {
        if (typeof classNames === 'object') return classNames;
        const borderClass = classNames.split(' ').find(className => /^border(-[xysetrlb]?-?(0|2|4|8)?)?$/.test(className));
        return borderClass ? borderClass.replace(/^border(-[xysetrlb]?-?)?/, '') : undefined;
      },
      encoder: (value) => `border-${value}`,
    },
    'Border Color': {
      type: 'color',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => /^(border-(inherit|current|transparent|black|white|[\w-]+-\d+))$/.test(className))?.replace('border-', ''),
      encoder: (value) => `border-${value}`,
    },
    'Border Style': {
      type: 'select',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => /^(border-solid|border-dashed|border-dotted|border-double|border-hidden|border-none)$/.test(className))?.replace('border-', ''),
      encoder: (value) => `border-${value}`,
    },
    'Rounded Corners': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => className.startsWith('rounded-'))?.replace('rounded-', ''),
      encoder: (value) => `rounded-${value}`,
    }
  },
  'Effects': {
    'Box Shadow': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => className.startsWith('shadow-'))?.replace('shadow-', ''),
      encoder: (value) => `shadow-${value}`,
    },
    'Opacity': {
      type: 'number',
      extractor: (classNames) => typeof classNames === 'object' ? classNames : classNames.split(' ').find(className => className.startsWith('opacity-'))?.replace('opacity-', ''),
      encoder: (value) => `opacity-${value}`,
    }
  },
  // 'Interactivity': {
  //   'Hover': {
  //     type: 'number',
  //     extractor: (classNames) => classNames.split(' ').find(className => className.startsWith('hover:'))?.split(':')[1],
  //   },
  //   'Focus': {
  //     type: 'number',
  //     extractor: (classNames) => classNames.split(' ').find(className => className.startsWith('focus:'))?.split(':')[1],
  //   },
  //   'Transition': {
  //     type: 'number',
  //     extractor: (classNames) => classNames.split(' ').find(className => className.startsWith('transition-'))?.replace('transition-', ''),
  //   }
  // }
}

const configLabelExtractor = (config: ComponentConfig | ProviderConfig | ListConfig): string => {
  if ('type' in config && typeof config.type === 'string') {
    return config.type;
  } else if ('name' in config && typeof config.name === 'string') {
    return config.name;
  } else {
    return 'List';
  }
}

const PropertyEditor = () => {
  const configs = useSelector((state: RootState) => Object.keys(state.canvas.selectedIds).filter(id => state.canvas.selectedIds[id]).map(id => state.canvas.componentState.present.configMap[id]).filter(config => 'attributes' in config)) as (ComponentConfig)[];
  const [api, setApi] = useState<CarouselApi>()
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
    <div className="flex flex-col h-full w-full overflow-y-auto items-center">
      <Carousel setApi={setApi} className="w-full justify-center max-w-xs">
        <CarouselPrevious/>
        <CarouselContent>
          {configs.map((config, index) => {
            const label = configLabelExtractor(config as ComponentConfig | ProviderConfig | ListConfig);
            return (
              <CarouselItem key={index} className="w-full flex justify-center">
                <Label className="text-lg font-semibold text-center">{label.charAt(0).toUpperCase() + label.slice(1)}</Label>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselNext/>
      </Carousel>
      <div className="flex flex-col h-full w-full px-2">
        {Object.keys(propertyMap).map((section, index) => {
          return (
            <section className="property-section flex flex-col gap-2">
              <Label className="section-title text-md font-regular py-1">{section}</Label>
              <div className="flex flex-col pl-2 gap-2">
                {Object.keys(propertyMap[section]).map((property) => {
                  const inputType = propertyMap[section][property].type === 'color' ? 'color' : 'text';
                  let value = propertyMap[section][property].extractor(configs[selectedIndex].attributes?.className || '');
                  if (!(typeof value === 'string')) {
                    value = '';
                  }
                  return (
                    <div className="flex justify-between items-center">
                      <Label className="property-item font-light">{property}</Label>
                      <Input type={inputType} className={`form-input rounded-md ${inputType === 'color' ? 'w-12 h-8' : 'w-24 h-full bg-gray-50'}`} value={value} onChange={(e) => {
                        const newValue = e.target.value;
                        console.log(newValue);
                        // TODO - wait until blur & compare previous className and current className then remove & add new if needed.
                        
                        // if (!newValue) {
                        //   dispatch(removeConfigClassName({ id: configs[selectedIndex].id, className: configs[selectedIndex].attributes.className }));
                        //   return;
                        // }
                        // const newClassName = propertyMap[section][property].encoder ? propertyMap[section][property].encoder(newValue) : newValue;
                        // dispatch(addConfigClassName({ id: configs[selectedIndex].id, className: newClassName }));
                      }}/>
                    </div>
                  )
                })}
              </div>
              <div className='w-full border-b border-gray-200 my-1' hidden={index === Object.keys(propertyMap).length - 1}></div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default PropertyEditor;