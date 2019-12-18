/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import 'normalize.css';

import './index.css';

import { Link, useStaticQuery, graphql } from 'gatsby';
import { ThemeProvider } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import { CodeRainSection } from './components';
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
      {!hideHeader && <Header />}
      <div style={{ overflow: 'hidden' }}>{children}</div>
      <CodeRainSection
        style={{
          paddingTop: 20,
          paddingBottom: 20,
          boxShadow: 'inset rgba(0, 0, 0, 0.31) 0 10px 5px -10px',
          // borderTop: '1px solid black',
        }}
      >
        <footer>
          <div style={{ marginBottom: 10 }}>
            {/* TODO: Consider adding a curriculum link: */}
            {/* <FooterLink to="/curriculum">Curriculum</FooterLink> */}
            <FooterLink to="/curriculum">Curriculum</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
          </div>
          <div>
            <small>© {new Date().getFullYear()} Prototype X</small>
          </div>
        </footer>
      </CodeRainSection>
    </ThemeProvider>
  );
};

export default Layout;
