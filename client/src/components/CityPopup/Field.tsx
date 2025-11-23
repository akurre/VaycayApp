import { Text, useMantineColorScheme } from '@mantine/core';

interface FieldProps {
  label: string;
  value: string | number;
  monospace?: boolean;
}

const Field = ({ label, value, monospace }: FieldProps) => {
  const { colorScheme } = useMantineColorScheme();
  const labelColor = colorScheme === 'dark' ? 'tertiary-purple.4' : 'tertiary-purple.7';

  return (
    <div>
      <Text size="sm" c={labelColor}>
        {label}
      </Text>
      <Text size="md" ff={monospace ? 'monospace' : undefined}>
        {value}
      </Text>
    </div>
  );
};

export default Field;
