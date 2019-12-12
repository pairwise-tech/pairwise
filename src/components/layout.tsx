/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import './index.css';

import { Link, useStaticQuery, graphql } from 'gatsby';
import { ThemeProvider } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import Header from './Header';
import theme from './theme';

interface LayoutProps {
  children: ReactNode;
  hideHeader: boolean;
}

const FooterLink = styled(Link)`
  display: inline-block;
  margin-right: 20px;
  color: white;
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
      {!hideHeader && <Header siteTitle={data.site.siteMetadata.title} />}
      {children}
      <Container
        style={{
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: '#1d1d1d',
        }}
      >
        <footer>
          <div style={{ marginBottom: 10 }}>
            <FooterLink to="/curriculum">Curriculum</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
          </div>
          <div>
            <small>© {new Date().getFullYear()} Prototype X</small>
          </div>
        </footer>
      </Container>
    </ThemeProvider>
  );
};

export default Layout;
