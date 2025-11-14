import React, { useEffect, useState } from 'react';
// 1. FIX: Import 'Slider' and 'ColorInput'
import { Text, ScrollArea, Stack, Divider, ColorSwatch, Group, NumberInput, Select, Button, TextInput, Box, Slider, ColorInput } from '@mantine/core';
import { useFabricCanvas } from '../../context/CanvasContext';
import { Object as FabricObject, Textbox, Rect, Circle, Triangle, Line, Ellipse, Polygon, Polyline } from 'fabric';
import { RotateCcwIcon, RotateCwIcon } from 'lucide-react';

interface PropertiesPanelProps {
  opened: boolean;
  onToggle: () => void;
}

const isTextbox = (obj: FabricObject | null): obj is Textbox => {
  return obj?.type === 'textbox' || obj?.type === 'i-text';
};

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
  const [angle, setAngle] = useState(selectedObject?.get('angle') || 0);

  // 2. FIX: Add state for new properties
  const [fillColor, setFillColor] = useState(selectedObject?.get('fill') as string || '#000000');
  const [strokeColor, setStrokeColor] = useState(selectedObject?.get('stroke') as string || '#000000');
  const [strokeWidth, setStrokeWidth] = useState(selectedObject?.get('strokeWidth') || 0);

  useEffect(() => {
    if (selectedObject) {
      setOpacity(selectedObject.get('opacity') || 1);
      setWidth(selectedObject.getScaledWidth());
      setHeight(selectedObject.getScaledHeight());
      setAngle(selectedObject.get('angle') || 0);

      // 3. FIX: Load new properties when selected object changes
      setFillColor(selectedObject.get('fill') as string || '#000000');
      setStrokeColor(selectedObject.get('stroke') as string || '#000000');
      setStrokeWidth(selectedObject.get('strokeWidth') || 0);

      if (isTextbox(selectedObject)) {
        setText(selectedObject.text || '');
        setFontSize(selectedObject.fontSize || 24);
      }
    }
  }, [selectedObject]);

  const handlePropertyChange = (property: string, value: string | number | boolean | undefined) => {
    if (!canvas || !selectedObject) return;
    
    selectedObject.set(property, value);

    if (property === 'angle') {
      setAngle(Number(value) || 0);
    }
    // 4. FIX: Sync stroke width state
    if (property === 'strokeWidth') {
      setStrokeWidth(Number(value) || 0);
    }
    
    selectedObject.setCoords();
    canvas.renderAll();
  };

  // 5. FIX: Simplify Fill handler
  const handleFillChange = (color: string) => {
    if (!canvas || !selectedObject) return;
    setFillColor(color);
    selectedObject.set('fill', color);
    canvas.renderAll();
  };

  // 6. FIX: Add new Stroke Color handler
  const handleStrokeChange = (color: string) => {
    if (!canvas || !selectedObject) return;
    setStrokeColor(color);
    selectedObject.set('stroke', color);
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
      if (selectedObject.width) {
        selectedObject.set('scaleX', numValue / selectedObject.width);
      }
    } else {
      setHeight(numValue);
      if (selectedObject.height) {
        selectedObject.set('scaleY', numValue / selectedObject.height);
      }
    }
    
    selectedObject.setCoords();
    canvas.renderAll();
  };

  const handleRotate = (direction: 'left' | 'right') => {
    if (!canvas || !selectedObject) return;

    const currentAngle = angle;
    let newAngle;

    if (direction === 'right') {
      newAngle = currentAngle + 90;
    } else {
      newAngle = currentAngle - 90;
    }

    newAngle = (newAngle + 360) % 360;

    setAngle(newAngle);
    selectedObject.set('angle', newAngle);
    selectedObject.setCoords();
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
              <NumberInput 
                value={Math.round(angle)}
                onChange={(val) => handlePropertyChange('angle', Number(val))}
                min={0}
                max={360}
                step={1}
                suffix="°"
              />
            </div>
            <div>
              <Text size="xs" fw={500} mb={4}>Rotate</Text>
              <Group grow>
                <Button 
                  variant="default" 
                  leftSection={<RotateCcwIcon size={16} />}
                  onClick={() => handleRotate('left')}
                >
                  Left
                </Button>
                <Button 
                  variant="default" 
                  leftSection={<RotateCwIcon size={16} />}
                  onClick={() => handleRotate('right')}
                >
                  Right
                </Button>
              </Group>
            </div>
          </Stack>
        )}

        <Divider my="md" />
        
        {/* 7. FIX: Updated Fill Color section */}
        <div>
          <Text size="xs" fw={500} mb={4}>
            Fill Color
          </Text>
          <ColorInput
            value={fillColor}
            onChange={handleFillChange}
            format="hex"
            placeholder="Custom color"
          />
          <Group gap="xs" mt="xs">
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

        {/* 8. FIX: Added new Border/Stroke section */}
        <Stack gap="md" mt="md">
          <Divider />
          <div>
            <Text size="xs" fw={500} mb={4}>Border Color</Text>
            <ColorInput
              value={strokeColor}
              onChange={handleStrokeChange}
              format="hex"
              placeholder="Custom color"
            />
            <Group gap="xs" mt="xs">
              {colors.map(color => (
                <ColorSwatch
                  key={color}
                  color={color}
                  size={22}
                  style={{ cursor: 'pointer', border: color === 'transparent' ? '1px solid #ccc' : 'none' }}
                  onClick={() => handleStrokeChange(color)}
                />
              ))}
            </Group>
          </div>
          <div>
            <Text size="xs" fw={500} mb={4}>Border Width</Text>
            <NumberInput
              value={strokeWidth}
              onChange={(val) => handlePropertyChange('strokeWidth', val)}
              min={0}
              step={1}
            />
          </div>
        </Stack>
        
        {/* 9. FIX: Kept Opacity as a Slider */}
        <div className="mt-4">
          <Divider my="md" />
          <Text size="xs" fw={500} mb={4}>Opacity</Text>
          <Slider 
            value={opacity} 
            onChange={handleOpacityChange} 
            min={0} 
            max={1} 
            step={0.01} 
            label={(value) => `${Math.round(value * 100)}%`}
          />
        </div>
      </ScrollArea>
    </Box>;
};

export default PropertiesPanel;