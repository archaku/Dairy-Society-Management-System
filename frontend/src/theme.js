import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a5d1a', // Deep Forest Green
      light: '#4c904c',
      dark: '#002f00',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f59e0b', // Amber/Gold for accents
      light: '#ffcf50',
      dark: '#bd7000',
      contrastText: '#fff',
    },
    background: {
      default: '#f8fafc', // Light slate gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Dark slate
      secondary: '#64748b', // Muted slate
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

export default theme;
