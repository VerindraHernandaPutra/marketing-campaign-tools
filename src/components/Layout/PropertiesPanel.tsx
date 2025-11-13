import React from 'react';
import { Text, ScrollArea, Stack, Divider, ColorSwatch, Group, NumberInput, Select, Slider, TextInput, Box } from '@mantine/core';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon, BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';

interface PropertiesPanelProps {
  opened: boolean;
  onToggle: () => void;
  selectedElement: string | null;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement
}) => {
  // Mock data - in a real app, you would get this from your state
  const isTextElement = selectedElement?.startsWith('text-');
  const isShapeElement = selectedElement?.startsWith('shape-');
  const colors = ['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14', '#ffffff', 'transparent'];
  return <Box p="md" w={300}>
      <ScrollArea h="calc(100vh - 60px)" mx="-xs" px="xs">
        {/* 'weight' diubah menjadi 'fw' */}
        <Text fw={500} size="sm" mb="md">
          {isTextElement ? 'Text Properties' : isShapeElement ? 'Shape Properties' : 'Properties'}
        </Text>
        {/* 'spacing' diubah menjadi 'gap' */}
        {isTextElement && <Stack gap="md">
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Text
              </Text>
              <TextInput defaultValue="Click to edit this text" />
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
          }]} defaultValue="arial" />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Size
              </Text>
              <NumberInput defaultValue={16} min={8} max={72} />
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
        {isShapeElement && <Stack gap="md">
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Width
              </Text>
              <NumberInput defaultValue={200} min={10} max={1000} />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Height
              </Text>
              <NumberInput defaultValue={150} min={10} max={1000} />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Border Radius
              </Text>
              <Slider defaultValue={8} min={0} max={50} />
            </div>
            <div>
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Rotation
              </Text>
              <Slider defaultValue={0} min={0} max={360} />
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
            {colors.map(color => <ColorSwatch key={color} color={color} size={22} style={{
            cursor: 'pointer'
          }} />)}
          </Group>
        </div>
        {isShapeElement && <>
            <div className="mt-4">
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Border Color
              </Text>
              {/* 'spacing' diubah menjadi 'gap' */}
              <Group gap="xs">
                {colors.map(color => <ColorSwatch key={color} color={color} size={22} style={{
              cursor: 'pointer'
            }} />)}
              </Group>
            </div>
            <div className="mt-4">
              {/* 'weight' diubah menjadi 'fw' */}
              <Text size="xs" fw={500} mb={4}>
                Border Width
              </Text>
              <Slider defaultValue={0} min={0} max={10} />
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
              <NumberInput defaultValue={100} min={0} max={1000} />
            </div>
            <div>
              <Text size="xs">Y</Text>
              <NumberInput defaultValue={100} min={0} max={1000} />
            </div>
          </Group>
        </div>
        <div className="mt-4">
          {/* 'weight' diubah menjadi 'fw' */}
          <Text size="xs" fw={500} mb={4}>
            Opacity
          </Text>
          <Slider defaultValue={100} min={0} max={100} />
        </div>
      </ScrollArea>
    </Box>;
};

export default PropertiesPanel;