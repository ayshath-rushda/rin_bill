import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
          <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
            {this.state.error.stack || this.state.error.message || String(this.state.error)}
          </pre>
          <button
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
