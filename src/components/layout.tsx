/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import './index.css';

import { ThemeProvider } from '@material-ui/core/styles';
import { useStaticQuery, graphql } from 'gatsby';
import Container from '@material-ui/core/Container';
import React, { ReactNode } from 'react';

import Header from './Header';
import theme from './theme';

interface LayoutProps {
  children: ReactNode;
  hideHeader: boolean;
}

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

  return (
    <ThemeProvider theme={theme}>
      {!hideHeader && <Header siteTitle={data.site.siteMetadata.title} />}
      {children}
      <Container style={{ paddingTop: 40 }}>
        <footer>
          © {new Date().getFullYear()}, Built with
          {` `}
          <a href="https://www.gatsbyjs.org">Gatsby</a>
        </footer>
      </Container>
    </ThemeProvider>
  );
};

export default Layout;
