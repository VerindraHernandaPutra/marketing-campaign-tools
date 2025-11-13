import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { Text, ScrollArea, Stack, Divider, ColorSwatch, Group, NumberInput, Select, Slider, TextInput, Box } from '@mantine/core';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon, BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';

interface PropertiesPanelProps {
  opened: boolean;
  onToggle: () => void;
  activeObject: fabric.Object | null;
  canvas: fabric.Canvas | null;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeObject,
  canvas
}) => {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fillColor, setFillColor] = useState('#000000');
  useEffect(() => {
    if (activeObject) {
      if (activeObject.type === 'textbox') {
        const textObject = activeObject as fabric.Textbox;
        setText(textObject.text || '');
        setFontSize(textObject.fontSize || 16);
      }
      setFillColor(activeObject.fill as string || '#000000');
    }
  }, [activeObject]);
  const handlePropertyChange = (property: string, value: any) => {
    if (activeObject && canvas) {
      activeObject.set(property as keyof fabric.Object, value);
      canvas.renderAll();
    }
  };
  const isTextObject = activeObject instanceof fabric.Textbox;
  const isShape = activeObject && !isTextObject;
  const colors = ['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14', '#ffffff', 'transparent'];
  return <Box p="md" w={300}>
      <ScrollArea h="calc(100vh - 60px)" mx="-xs" px="xs">
        {/* 'weight' diubah menjadi 'fw' */}
        <Text fw={500} size="sm" mb="md">
          {isTextObject ? 'Text Properties' : isShape ? 'Shape Properties' : 'Properties'}
        </Text>
        {/* 'spacing' diubah menjadi 'gap' */}
        {isTextObject && <Stack gap="md">
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Text
              </Text>
              <TextInput value={text} onChange={e => {
              setText(e.currentTarget.value);
              handlePropertyChange('text', e.currentTarget.value);
            }} />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Font
              </Text>
              <Select data={[{
            value: 'arial',
            label: 'Arial'
          }, {
            value: 'times-new-roman',
            label: 'Times New Roman'
          }, {
            value: 'roboto',
            label: 'Roboto'
          }, {
            value: 'open-sans',
            label: 'Open Sans'
          }]} defaultValue="arial" onChange={value => handlePropertyChange('fontFamily', value)} />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Size
              </Text>
              <NumberInput value={fontSize} onChange={value => {
              const newSize = Number(value);
              setFontSize(newSize);
              handlePropertyChange('fontSize', newSize);
            }} min={8} max={72} />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Style
              </Text>
              <Group>
                <BoldIcon size={18} />
                <ItalicIcon size={18} />
                <UnderlineIcon size={18} />
              </Group>
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Alignment
              </Text>
              <Group>
                <AlignLeftIcon size={18} />
                <AlignCenterIcon size={18} />
                <AlignRightIcon size={18} />
              </Group>
            </div>
          </Stack>}
        {/* 'spacing' diubah menjadi 'gap' */}
        {isShape && <Stack gap="md">
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Width
              </Text>
              <NumberInput value={activeObject?.width} onChange={value => handlePropertyChange('width', Number(value))} min={10} max={1000} />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Height
              </Text>
              <NumberInput value={activeObject?.height} onChange={value => handlePropertyChange('height', Number(value))} min={10} max={1000} />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Rotation
              </Text>
              <Slider value={activeObject?.angle} onChange={value => handlePropertyChange('angle', value)} min={0} max={360} />
            </div>
          </Stack>}
        <Divider my="md" />
        <div>
          {/* 'weight' diubah menjadi 'fw' */}
          <Text size="xs" fw={500} mb={4}>
            Fill Color
          </Text>
          {/* 'spacing' diubah menjadi 'gap' */}
          <Group gap="xs">
            {colors.map(color => <ColorSwatch key={color} color={color} size={22} onClick={() => {
            setFillColor(color);
            handlePropertyChange('fill', color);
          }} style={{
            cursor: 'pointer'
          }} />)}
          </Group>
        </div>
        {isShape && <>
            <div className="mt-4">
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Border Color
              </Text>
              {/* 'spacing' diubah menjadi 'gap' */}
              <Group gap="xs">
                {colors.map(color => <ColorSwatch key={color} color={color} size={22} onClick={() => handlePropertyChange('stroke', color)} style={{
              cursor: 'pointer'
            }} />)}
              </Group>
            </div>
            <div className="mt-4">
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Border Width
              </Text>
              <Slider value={activeObject?.strokeWidth} onChange={value => handlePropertyChange('strokeWidth', value)} min={0} max={10} />
            </div>
          </>}
        <Divider my="md" />
        <div>
          {/* 'weight' diubah menjadi 'fw' */}
          <Text size="xs" fw={500} mb={4}>
            Position
          </Text>
          <Group grow>
            <div>
              <Text size="xs">X</Text>
              <NumberInput value={activeObject?.left} onChange={value => handlePropertyChange('left', Number(value))} min={0} max={1000} />
            </div>
            <div>
              <Text size="xs">Y</Text>
              <NumberInput value={activeObject?.top} onChange={value => handlePropertyChange('top', Number(value))} min={0} max={1000} />
            </div>
          </Group>
        </div>
        <div className="mt-4">
          {/* 'weight' diubah menjadi 'fw' */}
          <Text size="xs" fw={500} mb={4}>
            Opacity
          </Text>
          <Slider value={(activeObject?.opacity ?? 0) * 100} onChange={value => handlePropertyChange('opacity', value / 100)} min={0} max={100} />
        </div>
      </ScrollArea>
    </Box>;
};

export default PropertiesPanel;