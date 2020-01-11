import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';

const theme = responsiveFontSizes(
  createMuiTheme({
    palette: {
      type: 'dark',
      primary: { main: 'rgb(0, 255, 185)' }, // Green
      secondary: { main: '#f50057' }, // Pink-ish
    },
  }),
);

export default theme;
