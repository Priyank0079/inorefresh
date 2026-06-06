import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadError(error: Error): boolean {
  const msg = error?.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Unable to preload CSS') ||
    msg.includes('ChunkLoadError') ||
    /Loading chunk \d+ failed/.test(msg)
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  private static readonly RELOAD_KEY = 'chunk_error_reloaded';

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Clear the reload guard once the app has mounted successfully so a second
    // chunk error later in the same tab session can also trigger a reload.
    sessionStorage.removeItem(ErrorBoundary.RELOAD_KEY);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // A chunk-load failure means a new build was deployed while the user had
    // the old index.html cached. The old chunk filenames no longer exist on
    // the server. A hard reload fetches the new index.html and correct chunks.
    if (isChunkLoadError(error)) {
      // Guard against an infinite reload loop within a single page load cycle.
      if (!sessionStorage.getItem(ErrorBoundary.RELOAD_KEY)) {
        sessionStorage.setItem(ErrorBoundary.RELOAD_KEY, '1');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      if (err && isChunkLoadError(err)) {
        // Auto-reload is in flight; show a brief message in the meantime
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Updating app…</h2>
              <p className="text-gray-500 text-sm mb-4">A new version is available. Reloading now.</p>
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        );
      }

      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
