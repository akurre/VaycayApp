import { Text, useMantineColorScheme } from '@mantine/core';

interface FieldProps {
  label: string;
  value: string | number;
  monospace?: boolean;
  valueColor?: string;
  secondaryValue?: string | number;
  secondaryValueColor?: string;
  isHorizontal?: boolean;
}

const Field = ({
  label,
  value,
  monospace,
  valueColor,
  secondaryValue,
  secondaryValueColor,
  isHorizontal,
}: FieldProps) => {
  const { colorScheme } = useMantineColorScheme();
  const labelColor = colorScheme === 'dark' ? 'tertiary-purple.4' : 'tertiary-purple.7';
  const classNames = `w-full ${isHorizontal ? 'flex gap-2' : ''}`;

  return (
    <div className={classNames}>
      <Text size="sm" c={labelColor}>
        {label}
      </Text>
      <Text size="md" ff={monospace ? 'monospace' : undefined} style={{ color: valueColor }}>
        {value}
      </Text>
      {secondaryValue !== undefined && (
        <Text
          size="md"
          ff={monospace ? 'monospace' : undefined}
          style={{ color: secondaryValueColor }}
        >
          {secondaryValue}
        </Text>
      )}
    </div>
  );
};

export default Field;
