import { Text } from '@mantine/core';

interface FieldProps {
  label: string;
  value: string | number;
  monospace?: boolean;
}

const Field = ({ label, value, monospace }: FieldProps) => {
  return (
    <div>
      <Text size="sm">{label}</Text>
      <Text size="md" ff={monospace ? 'monospace' : undefined}>
        {value}
      </Text>
    </div>
  );
};

export default Field;
