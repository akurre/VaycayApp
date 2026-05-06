import { describe, it, expect } from 'vitest';
import { IconHome } from '@tabler/icons-react';
import { render, screen } from '@/test-utils';
import CommandBarTriggerButton from '@/components/Navigation/CommandBarTriggerButton';

describe('CommandBarTriggerButton', () => {
  it('renders the children as the button label', () => {
    render(
      <CommandBarTriggerButton isOpen={false} icon={IconHome}>
        Hello
      </CommandBarTriggerButton>
    );
    expect(screen.getByRole('button')).toHaveTextContent('Hello');
  });

  it('renders the supplied icon component', () => {
    const { container } = render(
      <CommandBarTriggerButton isOpen={false} icon={IconHome}>
        Hello
      </CommandBarTriggerButton>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a button regardless of isOpen', () => {
    const { rerender } = render(
      <CommandBarTriggerButton isOpen={false} icon={IconHome}>
        Hello
      </CommandBarTriggerButton>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <CommandBarTriggerButton isOpen={true} icon={IconHome}>
        Hello
      </CommandBarTriggerButton>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
