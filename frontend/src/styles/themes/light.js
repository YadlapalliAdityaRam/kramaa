export const lightTheme = {
    colors: {
        primary: '#6366F1', // Indigo 500
        primaryLight: '#818CF8', // Indigo 400
        primaryDark: '#4F46E5', // Indigo 600
        secondary: '#EC4899', // Pink 500
        secondaryLight: '#F472B6', // Pink 400
        secondaryDark: '#DB2777', // Pink 600
        background: '#F8FAFC', // Slate 50
        surface: '#FFFFFF', // White
        text: {
            primary: '#1E293B', // Slate 800
            secondary: '#475569', // Slate 600
            disabled: '#94A3B8', // Slate 400
            inverse: '#FFFFFF',
        },
        border: '#E2E8F0', // Slate 200
        success: '#10B981', // Emerald 500
        warning: '#F59E0B', // Amber 500
        error: '#EF4444', // Red 500
        info: '#3B82F6', // Blue 500
        animation: {
            default: '#94A3B8', // Slate 400
            active: '#EC4899', // Pink 500 (Current element)
            compare: '#F59E0B', // Amber 500 (Comparing)
            sorted: '#10B981', // Emerald 500 (Sorted)
            pivot: '#8B5CF6', // Violet 500 (Quicksort pivot)
        },
    },
    typography: {
        fontFamily: "'Inter', sans-serif",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            xxl: '1.5rem',
        },
        fontWeight: {
            regular: 400,
            medium: 500,
            bold: 700,
        },
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
};
