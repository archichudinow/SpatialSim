import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('=== ERROR BOUNDARY CAUGHT ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    console.error('Component Stack:', errorInfo?.componentStack);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#1a1a1a',
          color: '#ff6b6b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'monospace',
          zIndex: 9999,
          overflow: 'auto',
          padding: '20px'
        }}>
          <h1>Error</h1>
          <pre style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '20px', 
            borderRadius: '4px',
            maxWidth: '90%',
            maxHeight: '60vh',
            overflowX: 'auto',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            <strong>Error:</strong> {this.state.error?.toString()}
            <hr style={{ borderColor: '#555', margin: '10px 0' }} />
            <strong>Stack:</strong><br />
            {this.state.error?.stack}
            <hr style={{ borderColor: '#555', margin: '10px 0' }} />
            <strong>Component Stack:</strong><br />
            {this.state.errorInfo?.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
