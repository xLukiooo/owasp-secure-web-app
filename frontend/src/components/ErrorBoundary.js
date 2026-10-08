import React from 'react';

/**
 * Komponent ErrorBoundary do obsługi błędów w drzewie komponentów.
 * Jeśli wystąpi błąd, wyświetla komunikat zamiast awarii całej aplikacji.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Coś poszło nie tak. Spróbuj ponownie później.</h2>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
