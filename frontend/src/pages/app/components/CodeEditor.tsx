import { useRef, useCallback, useEffect } from 'react';
import AceEditor from 'react-ace';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { JSXAttribute } from '@babel/types';

// Import the mode (language) and theme
import 'ace-builds/src-noconflict/mode-tsx';
import 'ace-builds/src-noconflict/theme-kr_theme';
import "ace-builds/webpack-resolver";
// ace.config.set('basePath', process.env.PUBLIC_URL)

const getComponentName = (node: any): string => {
  if (node.type === 'JSXIdentifier') {
    return node.name;
  } else if (node.type === 'JSXMemberExpression') {
    return `${getComponentName(node.object)}.${node.property.name}`;
  } else if (node.type === 'JSXNamespacedName') {
    return `${node.namespace.name}:${node.name.name}`;
  }
  return '';
};

const extractValue = (node: any): string | null => {
  switch (node.type) {
    case 'StringLiteral':
    case 'JSXText':
      return node.value;
    case 'JSXElement':
      return getComponentName(node.openingElement.name);
    case 'JSXExpressionContainer':
    default:
      return null;
  }
};

const compareValues = (oldValue: any, newValue: any): boolean => {
  // Basic type comparison (string, number, etc.)
  if (oldValue === newValue) return true;

  // For complex Babel types, compare their significant properties
  if (oldValue.type && newValue.type) {
    return extractValue(oldValue) === extractValue(newValue);
  }

  // Fallback for unrecognized or unhandled types
  return false;
};

const CodeEditor = ({code, setCode, updateAttributes}: {code: string, setCode: (code: string) => void, updateAttributes: (attributes: {key: string, value: string | null}[]) => void}) => {

  const codeIdentifier = useRef<string | null>(null);
  const codeAttributes = useRef<(JSXAttribute)[] | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedUpdateAttributes = useCallback((args: {key: string, value: string | null}[]) => {
    // Clear any existing timeout to reset the debounce timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      updateAttributes(args);
      // Clear the timeout ref once the callback has been called
      timeoutRef.current = null;
    }, 1000); // 1s debounce time
  }, [updateAttributes]);

  // Cleanup the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);


  const onChange = (newValue: string) => {
    if (!newValue) return;
    setCode(newValue);

    let ast;
    try {
      ast = parser.parse(newValue, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });
    } catch (error) {
      console.error('Error parsing code:', error);
      return; // Optionally handle the error, e.g., by exiting the function
    }

    traverse(ast, {
      JSXElement(path) {
        const openingElement = path.node.openingElement;
        const componentName = getComponentName(openingElement.name);
        if (!codeIdentifier.current) {
          codeIdentifier.current = componentName;
        } else if (codeIdentifier.current !== componentName) {
          console.log('Component identifier changed:', componentName);
        }
        
        const attributes = openingElement.attributes.filter(att => att.type === 'JSXAttribute') as JSXAttribute[];
        if (!codeAttributes.current) {
          codeAttributes.current = attributes;
        } else if (codeAttributes.current !== attributes) {
          console.log('Attributes have changed.');
          const currentAttributes = new Set(codeAttributes.current.map(attr => attr.name.name));
          const newAttributes = new Set(attributes.map(attr => attr.name.name));
        
          const addedAttributes = attributes.filter(attr => !currentAttributes.has(attr.name.name));
          const removedAttributes = codeAttributes.current.filter(attr => !newAttributes.has(attr.name.name));
        
          let changed = false;
          if (addedAttributes.length > 0) {
            console.log('Added attributes:', addedAttributes.map(attr => attr.name.name).join(', '));
            changed = true;
          }
        
          if (removedAttributes.length > 0) {
            console.log('Removed attributes:', removedAttributes.map(attr => attr.name.name).join(', '));
            changed = true;
          }

          type ChangedAttribute = {
            attrName: string;
            oldValue: string | null
            newValue: string | null;
          };

          const changedAttributes: ChangedAttribute[] = [];
          attributes.forEach(attr => {
            const attrName = attr.name.name;
            const oldValue = currentAttributes.has(attrName) ? codeAttributes.current?.find(a => a.name.name === attrName) as JSXAttribute : undefined;
            const newValue = attr;
            if (oldValue && newValue.value && oldValue.value && !compareValues(oldValue.value, newValue.value)) {
              changedAttributes.push({attrName: typeof attrName === 'string' ? attrName : attrName.name, oldValue: extractValue(oldValue.value), newValue: extractValue(newValue.value)});
            }
          });

          if (changedAttributes.length > 0) {
            console.log('Changed attributes:', changedAttributes.map(({attrName, oldValue, newValue}) => `${attrName}: from "${oldValue}" to "${newValue}"`).join(', '));
            changed = true;
          }
          codeAttributes.current = attributes;

          if (changed) {
            debouncedUpdateAttributes(attributes.map(attr => ({key: typeof attr.name.name === 'string' ? attr.name.name : attr.name.name.name, value: attr.value ? extractValue(attr.value) : null})));
          }
        }
      },
    });
  };

  return (
    <AceEditor
      style={{ width: '100%', height: '100%' }}
      mode="tsx"
      theme="kr_theme"
      onChange={onChange}
      name="component-code-editor"
      editorProps={{ $blockScrolling: true }}
      value={code || ''}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
        wrap: true,
      }}
    />
  );
};

export default CodeEditor;