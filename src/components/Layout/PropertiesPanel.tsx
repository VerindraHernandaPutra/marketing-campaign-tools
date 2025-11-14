import React, { useEffect, useState } from 'react';
import { Text, ScrollArea, Stack, Divider, ColorSwatch, Group, NumberInput, Select, Slider, TextInput, Box } from '@mantine/core';
import { useFabricCanvas } from '../../context/CanvasContext';
// 1. Import new Fabric classes
import { Object as FabricObject, Textbox, Rect, Circle, Triangle, Line, Ellipse, Polygon, Polyline } from 'fabric';

interface PropertiesPanelProps {
  opened: boolean;
  onToggle: () => void;
  // selectedElement prop is removed
}

const isTextbox = (obj: FabricObject | null): obj is Textbox => {
  return obj?.type === 'textbox' || obj?.type === 'i-text';
};

// 2. FIX: Update isShape to include all our new types
const isShape = (obj: FabricObject | null): obj is (Rect | Circle | Triangle | Line | Ellipse | Polygon | Polyline) => {
  if (!obj) return false;
  return ['rect', 'circle', 'triangle', 'line', 'ellipse', 'polygon', 'polyline'].includes(obj.type || '');
};


const PropertiesPanel: React.FC<PropertiesPanelProps> = () => {
  const { canvas, selectedObject } = useFabricCanvas();
  
  const [opacity, setOpacity] = useState(selectedObject?.get('opacity') || 1);
  const [text, setText] = useState(isTextbox(selectedObject) ? selectedObject.text : '');
  const [fontSize, setFontSize] = useState(isTextbox(selectedObject) ? selectedObject.fontSize : 24);
  const [width, setWidth] = useState(selectedObject?.getScaledWidth() || 100);
  const [height, setHeight] = useState(selectedObject?.getScaledHeight() || 100);

  useEffect(() => {
    if (selectedObject) {
      setOpacity(selectedObject.get('opacity') || 1);
      setWidth(selectedObject.getScaledWidth());
      setHeight(selectedObject.getScaledHeight());

      if (isTextbox(selectedObject)) {
        setText(selectedObject.text || '');
        setFontSize(selectedObject.fontSize || 24);
      }
    }
  }, [selectedObject]);

  const handlePropertyChange = (property: string, value: string | number | boolean | undefined) => {
    if (!canvas || !selectedObject) return;
    
    selectedObject.set(property, value);
    canvas.renderAll();
  };

  const handleFillChange = (color: string) => {
    if (!canvas || !selectedObject) return;

    // Polyline and Line don't have 'fill', they have 'stroke'
    if (selectedObject.type === 'line' || selectedObject.type === 'polyline') {
      selectedObject.set('stroke', color);
    } else {
      selectedObject.set('fill', color);
    }
    canvas.renderAll();
  };
  
  const handleOpacityChange = (value: number) => {
    if (!canvas || !selectedObject) return;
    
    setOpacity(value); 
    selectedObject.set('opacity', value);
    canvas.renderAll();
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !isTextbox(selectedObject)) return;
    
    const newText = e.currentTarget.value;
    setText(newText); 
    selectedObject.set('text', newText);
    canvas.renderAll();
  };

  const handleFontSizeChange = (value: number | string) => {
    if (!canvas || !isTextbox(selectedObject)) return;
    
    const newSize = Number(value);
    setFontSize(newSize);
    selectedObject.set('fontSize', newSize);
    canvas.renderAll();
  };
  
  const handleDimensionChange = (dim: 'width' | 'height', value: number | string) => {
    if (!canvas || !selectedObject) return;

    const numValue = Number(value);
    if (dim === 'width') {
      setWidth(numValue);
      selectedObject.scaleToWidth(numValue);
    } else {
      setHeight(numValue);
      selectedObject.scaleToHeight(numValue);
    }
    canvas.renderAll();
  };


  const colors = ['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14', '#ffffff', 'transparent'];

  if (!selectedObject) {
    return (
      <Box p="md" w={300}>
        <Text size="sm" ta="center" c="dimmed" mt="lg">
          Select an object to edit properties
        </Text>
      </Box>
    );
  }

  return <Box p="md" w={300}>
      <ScrollArea h="calc(100vh - 60px)" mx="-xs" px="xs">
        <Text fw={500} size="sm" mb="md">
          {isTextbox(selectedObject) ? 'Text Properties' : isShape(selectedObject) ? 'Shape Properties' : 'Object Properties'}
        </Text>
        
        {isTextbox(selectedObject) && (
          <Stack gap="md">
            <div>
              <Text size="xs" fw={500} mb={4}>Text</Text>
              <TextInput value={text} onChange={handleTextChange} />
            </div>
            <div>
              <Text size="xs" fw={500} mb={4}>Font Size</Text>
              <NumberInput value={fontSize} onChange={handleFontSizeChange} min={8} max={120} />
            </div>
            <div>
              <Text size="xs" fw={500} mb={4}>Font Family</Text>
              <Select 
                data={['Arial', 'Times New Roman', 'Roboto', 'Open Sans']} 
                value={selectedObject.fontFamily || 'Arial'}
                onChange={(val) => handlePropertyChange('fontFamily', val || 'Arial')}
              />
            </div>
          </Stack>
        )}
        
        {isShape(selectedObject) && (
          <Stack gap="md">
            <div>
              <Text size="xs" fw={500} mb={4}>Width</Text>
              <NumberInput 
                value={Math.round(width)}
                onChange={val => handleDimensionChange('width', val)}
              />
            </div>
            <div>
              <Text size="xs" fw={500} mb={4}>Height</Text>
              <NumberInput 
                value={Math.round(height)}
                onChange={val => handleDimensionChange('height', val)}
              />
            </div>
            <div>
              <Text size="xs" fw={500} mb={4}>Rotation</Text>
              <Slider 
                value={selectedObject.angle || 0}
                onChange={(val) => handlePropertyChange('angle', val)}
                min={0} max={360}
              />
            </div>
          </Stack>
        )}

        <Divider my="md" />
        
        <div>
          <Text size="xs" fw={500} mb={4}>
            {/* 3. FIX: Change label for lines/polylines */}
            {selectedObject.type === 'line' || selectedObject.type === 'polyline' ? 'Stroke Color' : 'Fill Color'}
          </Text>
          <Group gap="xs">
            {colors.map(color => (
              <ColorSwatch 
                key={color} 
                color={color} 
                size={22} 
                style={{ cursor: 'pointer', border: color === 'transparent' ? '1px solid #ccc' : 'none' }}
                onClick={() => handleFillChange(color)}
              />
            ))}
          </Group>
        </div>
        
        <div className="mt-4">
          <Text size="xs" fw={500} mb={4}>Opacity</Text>
          <Slider 
            value={opacity} 
            onChange={handleOpacityChange} 
            min={0} max={1} step={0.01} 
            label={(value) => `${Math.round(value * 100)}%`}
          />
        </div>
      </ScrollArea>
    </Box>;
};

export default PropertiesPanel;