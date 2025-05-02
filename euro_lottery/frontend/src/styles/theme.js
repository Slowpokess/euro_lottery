// Premium modern theme configuration for Euro Lottery
const themes = {
  light: {
    name: 'light',
    colors: {
      primary: '#4A3AFF',            // Rich vibrant blue/purple
      primaryLight: '#6D61FF',       // Lighter primary for hover states
      primaryDark: '#382DC0',        // Darker primary for active states
      secondary: '#FF4E50',          // Vibrant coral/red
      secondaryLight: '#FF6B6C',     // Lighter secondary
      tertiary: '#FFBD00',           // Vibrant gold/yellow
      success: '#00C853',            // Vibrant green
      warning: '#FFB100',            // Vibrant amber
      error: '#FF1744',              // Vibrant red
      info: '#00BCD4',               // Teal blue
      
      // Gradients
      gradient1: 'linear-gradient(135deg, #4A3AFF 0%, #842FE8 100%)',  // Blue to purple
      gradient2: 'linear-gradient(135deg, #FF4E50 0%, #F9D423 100%)',  // Red to yellow
      gradient3: 'linear-gradient(135deg, #00C853 0%, #00BCD4 100%)',  // Green to blue
      
      // UI Colors
      background: '#F8F9FC',        // Very light blue-tinted background
      backgroundAlt: '#FFFFFF',      // White alternating background
      card: '#FFFFFF',               // White card background
      cardHover: '#FFFFFF',          // White card hover state with shadow change
      border: '#E5E8F0',             // Light border color
      
      // Text colors
      text: '#1A1C29',               // Dark blue-black text
      textMedium: '#4F566B',         // Medium gray text
      textLight: '#8792A2',          // Light gray text
      textOnPrimary: '#FFFFFF',      // White text on primary color
      
      // Specific UI element colors
      jackpot: '#FFBD00',            // Gold for jackpot amounts
      ticketNumber: '#4A3AFF',       // Primary color for ticket numbers
      ticketNumberBg: '#EBEDFB',     // Very light purple background for numbers
      buttonHover: '#382DC0',        // Darker primary for button hover
    },
    
    // Typography
    typography: {
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      fontFamilyAlt: "'Montserrat', sans-serif",
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightSemiBold: 600,
      fontWeightBold: 700,
      
      // Size scale
      fontSize: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        md: '1rem',         // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
        '5xl': '3rem'       // 48px
      },
      
      // For fine-tuning specific text elements
      heading1: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01em'
      },
      heading2: {
        fontSize: '1.875rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01em'
      },
      heading3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em'
      }
    },
    
    // Spacing scale
    spacing: {
      xs: '0.25rem',      // 4px
      sm: '0.5rem',       // 8px
      md: '1rem',         // 16px
      lg: '1.5rem',       // 24px
      xl: '2rem',         // 32px
      '2xl': '2.5rem',    // 40px
      '3xl': '3rem',      // 48px
      '4xl': '4rem',      // 64px
      '5xl': '6rem'       // 96px
    },
    
    // Border radius
    borderRadius: {
      sm: '0.25rem',      // 4px
      md: '0.5rem',       // 8px
      lg: '0.75rem',      // 12px
      xl: '1rem',         // 16px
      '2xl': '1.5rem',    // 24px
      full: '9999px'      // Fully rounded (circles)
    },
    
    // Shadows
    shadows: {
      sm: '0 2px 8px rgba(0, 6, 54, 0.06)',
      md: '0 4px 16px rgba(0, 6, 54, 0.08)',
      lg: '0 8px 30px rgba(0, 6, 54, 0.12)',
      xl: '0 12px 40px rgba(0, 6, 54, 0.16)',
      inner: 'inset 0 2px 4px rgba(0, 6, 54, 0.06)',
      focus: '0 0 0 3px rgba(74, 58, 255, 0.4)',
      ticketCard: '0 10px 25px rgba(74, 58, 255, 0.08)',
      jackpot: '0 8px 20px rgba(255, 189, 0, 0.25)'
    },
    
    // Transitions
    transitions: {
      fast: '0.2s ease',
      normal: '0.3s ease',
      slow: '0.5s ease'
    },
    
    // Z-index layers
    zIndex: {
      nav: 100,
      dropdown: 200,
      modal: 300,
      tooltip: 400
    }
  },
  
  // Dark theme
  dark: {
    name: 'dark',
    colors: {
      primary: '#6D61FF',            // Brighter primary for dark mode
      primaryLight: '#8A7FFF',       // Even brighter for hover
      primaryDark: '#5146C0',        // Slightly darkened for active states
      secondary: '#FF6B6C',          // Brighter secondary
      secondaryLight: '#FF8E8F',     // Even brighter secondary
      tertiary: '#FFCF40',           // Brighter gold
      success: '#5CDD8D',            // Brighter green
      warning: '#FFC240',            // Brighter amber
      error: '#FF4D6A',              // Brighter red
      info: '#52CFEA',               // Brighter teal
      
      // Gradients
      gradient1: 'linear-gradient(135deg, #5146C0 0%, #9446E0 100%)',  // Dark blue to purple
      gradient2: 'linear-gradient(135deg, #FF6B6C 0%, #FFCF40 100%)',  // Red to gold
      gradient3: 'linear-gradient(135deg, #5CDD8D 0%, #52CFEA 100%)',  // Green to teal
      
      // UI Colors
      background: '#121829',          // Dark blue-black background
      backgroundAlt: '#1A2236',       // Slightly lighter blue-black
      card: '#1E293B',                // Navy blue card background
      cardHover: '#1E293B',           // Same color but with shadow change on hover
      border: '#2E3A54',              // Medium blue border
      
      // Text colors
      text: '#EDF2F9',                // Off-white text
      textMedium: '#A3B1CC',          // Medium blue-gray text
      textLight: '#627195',           // Light blue-gray text
      textOnPrimary: '#FFFFFF',       // White text on primary
      
      // Specific element colors
      jackpot: '#FFCF40',             // Brighter gold for jackpot amounts
      ticketNumber: '#6D61FF',        // Brighter primary for ticket numbers
      ticketNumberBg: '#252F47',      // Dark blue background for numbers
      buttonHover: '#8A7FFF',         // Brighter primary for button hover
    },
    
    // Typography - mostly the same as light theme
    typography: {
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      fontFamilyAlt: "'Montserrat', sans-serif",
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightSemiBold: 600,
      fontWeightBold: 700,
      
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      
      heading1: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01em'
      },
      heading2: {
        fontSize: '1.875rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01em'
      },
      heading3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em'
      }
    },
    
    // Same spacing
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '2.5rem',
      '3xl': '3rem',
      '4xl': '4rem',
      '5xl': '6rem'
    },
    
    // Same border radius
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem', 
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px'
    },
    
    // Adjusted shadows for dark mode
    shadows: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
      md: '0 4px 16px rgba(0, 0, 0, 0.4)',
      lg: '0 8px 30px rgba(0, 0, 0, 0.5)',
      xl: '0 12px 40px rgba(0, 0, 0, 0.6)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
      focus: '0 0 0 3px rgba(109, 97, 255, 0.6)',
      ticketCard: '0 10px 25px rgba(0, 0, 0, 0.5)',
      jackpot: '0 8px 20px rgba(255, 207, 64, 0.2)'
    },
    
    // Same transitions
    transitions: {
      fast: '0.2s ease',
      normal: '0.3s ease',
      slow: '0.5s ease'
    },
    
    // Same z-index
    zIndex: {
      nav: 100,
      dropdown: 200,
      modal: 300,
      tooltip: 400
    }
  }
};

export default themes;