import { Link } from 'gatsby';
import Container from '@material-ui/core/Container';
import React from 'react';
import styled from 'styled-components';

import { DESKTOP, GREEN_GRADIENT } from './components';
import Button from '@material-ui/core/Button';

interface HeaderProps {
  siteTitle?: string;
}

const BORDER = 2;

const StyledHeader = styled.header`
  display: flex;
  position: relative;
  padding-top: ${BORDER}px;
  padding-bottom: 0px;
  margin-bottom: 0;
  background: #212121;
  border-bottom: 1px solid #404040;
  height: 50px;

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
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${DESKTOP} {
    .menuToggle {
      display: none;
    }
  }
`;

// color: 'rgb(55,55,55)';
const Heading = styled.h1`
  font-weight: 100;
  font-family: 'Helvetica Neue', sans-serif;
  text-align: center;
  margin: 0;

  a {
    color: white;
  }

  ${DESKTOP} {
    margin-top: 0px;
    text-align: left;
  }
`;

const Nav = styled.nav<{ isOpen: boolean }>`
  display: flex;
  justify-content: center;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 5;
  flex-direction: column;
  background: #1e1e1e;
  padding-bottom: 20px;
  opacity: ${(props) => (props.isOpen ? '1' : '0')};
  pointer-events: ${(props) => (props.isOpen ? 'all' : 'none')};
  transform: translateY(${(props) => (props.isOpen ? '0' : '-15px')})
    scale(${(props) => (props.isOpen ? '1' : '0.95')});
  transition: opacity 0.2s ease, transform 0.2s ease;

  .externalLink {
    margin: 0 20px;
    margin-top: 10px;
  }

  ${DESKTOP} {
    opacity: 1;
    pointer-events: all;
    align-items: center;
    position: static;
    justify-content: flex-start;
    flex-direction: row;
    padding-bottom: 0;
    transform: unset;

    .externalLink {
      margin: 0;
    }
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

const Header = ({ siteTitle = 'Pairwise' }: HeaderProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <StyledHeader>
      <Flexbox onClick={() => setIsOpen(false)}>
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
        <Button
          variant="outlined"
          className="menuToggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          Menu
        </Button>
        <Nav isOpen={isOpen}>
          <NavLink to="/curriculum">Curriculum</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          {/* <NavLink to="/about">About</NavLink> */}
          <NavLink to="/contact">Contact</NavLink>
          <Button
            style={{ marginLeft: 10 }}
            className="externalLink"
            size="small"
            variant="outlined"
            href="https://app.pairwise.tech/login"
          >
            Log In
          </Button>
        </Nav>
      </Flexbox>
    </StyledHeader>
  );
};

export default Header;
