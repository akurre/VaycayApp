import { Component, ReactNode } from 'react';
import { Text, Button, Container } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { appColors } from '@/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // log error to console in development
    console.error('error boundary caught an error:', error, errorInfo);

    // call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // default error ui
      return (
        <Container size="sm" className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <IconAlertTriangle size={48} color={appColors.error} />
            <Text size="xl" fw={600}>
              something went wrong
            </Text>
            <Text size="sm" c="dimmed" className="max-w-md">
              {this.state.error?.message || 'an unexpected error occurred'}
            </Text>
            <Button onClick={this.handleReset} variant="light">
              try again
            </Button>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
