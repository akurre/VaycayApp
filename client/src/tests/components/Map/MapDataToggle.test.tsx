import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { userEvent } from '@testing-library/user-event';
import MapDataToggle from '@/components/Map/MapDataToggle';
import { DataType } from '@/types/mapTypes';

describe('MapDataToggle', () => {
  it('renders both data type options', () => {
    const mockOnChange = vi.fn();
    render(
      <MapDataToggle
        dataType={DataType.Temperature}
        onDataTypeChange={mockOnChange}
      />
    );

    const radioInputs = screen.getAllByRole('radio');

    expect(radioInputs).toHaveLength(2);
    expect(radioInputs[0]).toHaveAttribute('value', DataType.Temperature);
    expect(radioInputs[1]).toHaveAttribute('value', DataType.Sunshine);
  });

  it('shows sunshine as selected when dataType is sunshine', () => {
    const mockOnChange = vi.fn();
    render(
      <MapDataToggle
        dataType={DataType.Sunshine}
        onDataTypeChange={mockOnChange}
      />
    );

    const radioInputs = screen.getAllByRole('radio');
    const sunshineInput = radioInputs.find(
      (input) => (input as HTMLInputElement).value === DataType.Sunshine
    );

    expect(sunshineInput).toBeChecked();
  });

  it('calls onDataTypeChange with sunshine when sunshine option is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    const { container } = render(
      <MapDataToggle
        dataType={DataType.Temperature}
        onDataTypeChange={mockOnChange}
      />
    );

    const sunshineLabel = container.querySelector('label[for*="sunshine"]');
    expect(sunshineLabel).toBeInTheDocument();

    if (sunshineLabel) {
      await user.click(sunshineLabel);
    }

    expect(mockOnChange).toHaveBeenCalledWith(DataType.Sunshine);
  });
});
