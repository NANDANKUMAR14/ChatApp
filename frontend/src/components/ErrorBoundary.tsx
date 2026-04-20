import React, { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-red-500 flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-white mb-4">Error occurred!</h1>
          <p className="text-xl text-white mb-4">{this.state.error?.message}</p>
          <pre className="text-white text-sm bg-black p-4 rounded max-w-2xl overflow-auto">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
