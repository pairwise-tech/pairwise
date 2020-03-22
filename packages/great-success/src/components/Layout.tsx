/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */
import React from 'react';

import './index.css';

import styled from 'styled-components';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return <Background>{children}</Background>;
};

const Background = styled.div`
  background-image: url(${require('../images/pairwise-as-bg.png')});
  background-size: cover;
  height: 100vh;
`;

export default Layout;
