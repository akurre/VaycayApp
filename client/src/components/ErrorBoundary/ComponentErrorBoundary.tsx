import { Component, ReactNode } from 'react';
import { Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

/**
 * Lightweight error boundary for individual components.
**/

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  /** Name of the component for debugging purposes */
  componentName?: string;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const componentName = this.props.componentName || 'Component';

    // log error to console in development
    console.error(
      `[${componentName}] error boundary caught an error:`,
      error,
      errorInfo
    );

    // call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // minimal error UI for component-level errors
      return (
        <div className="flex items-center gap-2 p-2 text-red-400">
          <IconAlertCircle size={16} />
          <Text size="xs" c="dimmed">
            {this.props.componentName
              ? `${this.props.componentName} error`
              : 'Component error'}
          </Text>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
