import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { userEvent } from '@testing-library/user-event';
import MapViewToggle from '@/components/Map/MapViewToggle';
import { ViewMode } from '@/types/mapTypes';

describe('MapViewToggle', () => {
  it('renders both view mode options', () => {
    const mockOnChange = vi.fn();
    render(<MapViewToggle viewMode={ViewMode.Heatmap} onViewModeChange={mockOnChange} />);

    // component now uses icons, so we check for radio inputs by value
    const radioInputs = screen.getAllByRole('radio');

    expect(radioInputs).toHaveLength(2);
    expect(radioInputs[0]).toHaveAttribute('value', 'markers');
    expect(radioInputs[1]).toHaveAttribute('value', 'heatmap');
  });

  it('shows heatmap as selected when viewMode is heatmap', () => {
    const mockOnChange = vi.fn();
    render(<MapViewToggle viewMode={ViewMode.Heatmap} onViewModeChange={mockOnChange} />);

    // find the checked radio input
    const radioInputs = screen.getAllByRole('radio');
    const heatmapInput = radioInputs.find(
      (input) => (input as HTMLInputElement).value === 'heatmap'
    );

    expect(heatmapInput).toBeChecked();
  });

  it('shows markers as selected when viewMode is markers', () => {
    const mockOnChange = vi.fn();
    render(<MapViewToggle viewMode={ViewMode.Markers} onViewModeChange={mockOnChange} />);

    // find the checked radio input
    const radioInputs = screen.getAllByRole('radio');
    const markersInput = radioInputs.find(
      (input) => (input as HTMLInputElement).value === 'markers'
    );

    expect(markersInput).toBeChecked();
  });

  it('calls onViewModeChange with markers when markers option is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    const { container } = render(
      <MapViewToggle viewMode={ViewMode.Heatmap} onViewModeChange={mockOnChange} />
    );

    // find the label for markers input and click it
    const markersLabel = container.querySelector('label[for*="markers"]');
    expect(markersLabel).toBeInTheDocument();

    if (markersLabel) {
      await user.click(markersLabel);
    }

    expect(mockOnChange).toHaveBeenCalledWith('markers');
  });

  it('calls onViewModeChange with heatmap when heatmap option is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    const { container } = render(
      <MapViewToggle viewMode={ViewMode.Markers} onViewModeChange={mockOnChange} />
    );

    // find the label for heatmap input and click it
    const heatmapLabel = container.querySelector('label[for*="heatmap"]');
    expect(heatmapLabel).toBeInTheDocument();

    if (heatmapLabel) {
      await user.click(heatmapLabel);
    }

    expect(mockOnChange).toHaveBeenCalledWith('heatmap');
  });
});
