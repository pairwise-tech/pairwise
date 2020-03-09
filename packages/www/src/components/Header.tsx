import { Link } from 'gatsby';
import Container from '@material-ui/core/Container';
import React from 'react';
import styled from 'styled-components';

import { DESKTOP, GREEN_GRADIENT } from './components';

interface HeaderProps {
  siteTitle?: string;
}

const BORDER = 2;

const StyledHeader = styled.header`
  position: relative;
  padding-top: ${BORDER}px;
  padding-bottom: 0px;
  margin-bottom: 1.45rem;
  background: #212121;
  border-bottom: 1px solid #404040;

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: ${BORDER}px;
    background: ${GREEN_GRADIENT};
  }
`;

const Flexbox = styled(Container)`
  display: block;
  align-items: center;
  justify-content: center;

  ${DESKTOP} {
    display: flex;
    justify-content: space-between;
  }
`;

// color: 'rgb(55,55,55)';
const Heading = styled.h1`
  font-weight: 100;
  font-family: 'Helvetica Neue', sans-serif;
  text-align: center;
  margin: 0;
  margin-top: 5px;

  a {
    color: white;
  }

  ${DESKTOP} {
    margin-top: 0px;
    text-align: left;
  }
`;

const Nav = styled.nav`
  display: flex;
  justify-content: center;

  ${DESKTOP} {
    justify-content: flex-start;
  }
`;

const NavLink = styled(Link)`
  position: relative;
  display: block;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 1.2px;
  opacity: 0.8;
  text-decoration: none;
  color: white;
  line-height: 50px;
  padding: 0px 20px;
  font-size: 14px;
  transition: all 0.2s ease-out;
  background: transparent;

  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 2px;
    transition: all 0.2s ease-out;
    transform: scale(0);
    background: ${GREEN_GRADIENT};
  }
  &:hover {
    opacity: 1;
    background: #2d2d2d;
    &:after {
      transform: scale(1);
    }
  }
`;

const Header = ({ siteTitle = 'Pairwise' }: HeaderProps) => (
  <StyledHeader>
    <Flexbox>
      <Heading>
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            style={{ width: 'auto', height: 20, marginRight: 20 }}
            src={require('../images/logo.svg')}
            alt="Pairwise Logo"
          />
          {siteTitle}
        </Link>
      </Heading>
      <Nav>
        <NavLink to="/curriculum">Curriculum</NavLink>
        <NavLink to="/faq">FAQ</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </Nav>
    </Flexbox>
  </StyledHeader>
);

export default Header;
