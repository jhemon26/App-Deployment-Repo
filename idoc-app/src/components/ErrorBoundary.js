import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SPACING } from '../utils/theme';

/**
 * Global Error Boundary
 * Catches render errors and displays a fallback UI instead of crashing the app
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Update state so the next render will show the fallback UI
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.toString() || 'An unexpected error occurred'}
            </Text>

            {__DEV__ && this.state.errorInfo && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.debugText} numberOfLines={5}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => {
                // Reset to home or logout
                if (this.props.onReset) {
                  this.props.onReset();
                } else {
                  this.resetError();
                }
              }}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  message: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.md,
  },
  buttonText: {
    ...FONTS.bodyBold,
    color: COLORS.text,
  },
  buttonSecondaryText: {
    color: COLORS.primary,
  },
  debugInfo: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: SPACING.md,
    maxHeight: 200,
    width: '100%',
  },
  debugTitle: {
    ...FONTS.captionBold,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },
  debugText: {
    ...FONTS.small,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;
