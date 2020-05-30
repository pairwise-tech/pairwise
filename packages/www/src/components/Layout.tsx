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
import styled, { keyframes } from 'styled-components';

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
  const [loadIframe, setLoadIframe] = useState(false);
  const [showFlyIn, setShowFlyIn] = useState(false);

  useEffect(() => {
    const query = parseQuery(window.location.search.slice(1));
    if (typeof query.notify === 'string') {
      setNotification(query.notify);
    }
  }, []);

  useEffect(() => {
    const el = document.querySelector('#matrix-container');
    let timeout: null | number = null;

    const listener = () => {
      if (!el) {
        return;
      }
      const box = el.getBoundingClientRect();
      const scrollBottom = box.height + el.scrollTop;
      console.log('scrollBottom');

      if (scrollBottom + 100 > el.scrollHeight) {
        console.log('BOOM');
        el.removeEventListener('scroll', listener);
        setLoadIframe(true);
        timeout = setTimeout(() => {
          setShowFlyIn(true);
        }, 5000);
      }
    };

    el.addEventListener('scroll', listener);

    return () => {
      el.removeEventListener('scroll', listener);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  return (
    <>
      {loadIframe && (
        <FullFrame
          style={{
            animation: showFlyIn ? 'pw-fly-in 4s ease-out 1 0s' : '',
          }}
          src="http://localhost:3000/workspace/iSF4BNIl/hello-pairwise?iframePreview=1"
        />
      )}
      <MatrixContainer
        id="matrix-container"
        className={showFlyIn ? 'enterTheMatrix' : ''}
        key="flipdown"
      >
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
      </MatrixContainer>
    </>
  );
};

const FullFrame = styled.iframe`
  width: 100vw;
  height: 100vh;
  border: none;
  outline: none;
  position: absolute;
  top: 0;
  left: 0;
`;
const MatrixContainer = styled.div`
  overflow: auto;
  height: 100vh;
  position: relative;
  z-index: 2;
`;

export default Layout;
