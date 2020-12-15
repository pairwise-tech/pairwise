/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import 'normalize.css';

import './index.css';

import { Link, graphql, useStaticQuery } from 'gatsby';
import { ThemeProvider } from '@material-ui/core/styles';
import Close from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Info from '@material-ui/icons/Info';
import React, { ReactNode, useEffect, useState } from 'react';
import Slide from '@material-ui/core/Slide';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import styled from 'styled-components';

import { parse as parseQuery } from 'querystring';

import { CodeRainSection, GREEN_GRADIENT } from './components';
import Header from './Header';
import theme from './theme';

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
}

const FooterLink = styled(Link)`
  color: white;
  font-weight: 100;
  margin-right: 20px;
  display: inline-block;

  :hover {
    color: #00ffb9;
  }
`;

const StyledSnackbarContent = styled(SnackbarContent)`
  background: ${GREEN_GRADIENT};
`;

const Deemphasize = styled.div`
  ${FooterLink} {
    text-decoration: none;
    opacity: 0.5;
    &:hover {
      opacity: 1;
    }
  }
`;

const Layout = ({ children, hideHeader = false }: LayoutProps) => {
  // eslint-disable-next-line
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);
  const [notification, setNotification] = useState<string>('');
  const handleClose = () => setNotification('');

  useEffect(() => {
    const query = parseQuery(window.location.search.slice(1));
    if (typeof query.notify === 'string') {
      setNotification(query.notify);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {!hideHeader && <Header />}
      <div style={{ overflow: 'hidden', minHeight: 'calc(100vh - 140px)' }}>
        {children}
      </div>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={Boolean(notification)}
        TransitionComponent={(props: any) => (
          <Slide {...props} direction="down" />
        )}
        ContentProps={{
          'aria-describedby': 'message-id',
        }}
      >
        <StyledSnackbarContent
          aria-describedby="client-snackbar"
          message={
            <span
              id="client-snackbar"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Info style={{ marginRight: 20 }} />
              {notification}
            </span>
          }
          action={[
            <IconButton
              key="close"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <Close />
            </IconButton>,
          ]}
        />
      </Snackbar>
      <CodeRainSection
        style={{
          paddingTop: 20,
          paddingBottom: 20,
          boxShadow: 'inset rgba(0, 0, 0, 0.31) 0 10px 5px -10px',
        }}
      >
        <footer>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ marginBottom: 10 }}>
              <small>© {new Date().getFullYear()} Pairwise</small>
            </div>
            <Deemphasize>
              <FooterLink to="/media-kit">Media Kit</FooterLink>
              <FooterLink to="/terms">Terms of Service</FooterLink>
              <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
            </Deemphasize>
          </div>
        </footer>
      </CodeRainSection>
    </ThemeProvider>
  );
};

export default Layout;
