import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Bilinmeyen hata',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uygulama render hatasi:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        color: '#f8fafc',
        padding: '24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(15, 23, 42, 0.88)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(245, 158, 11, 0.18)',
            color: '#f59e0b',
            fontSize: '28px',
            marginBottom: '16px',
          }}>
            !
          </div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>Uygulama baslatilirken hata olustu</h1>
          <p style={{ margin: '0 0 14px 0', color: '#cbd5e1', lineHeight: 1.6 }}>
            Ekranin tamamen siyah kalmamasi icin guvenli hata ekrani acildi. Tekrar denemek icin uygulamayi yeniden yukleyebilirsin.
          </p>
          <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Hata: {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: '14px',
              padding: '14px 18px',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #f59e0b, #fb923c)',
              color: '#0f172a',
            }}
          >
            Uygulamayi Yeniden Yukle
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
