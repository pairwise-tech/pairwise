import { Link } from 'gatsby';
import Container from '@material-ui/core/Container';
import React from 'react';
import styled from 'styled-components';

interface HeaderProps {
  siteTitle?: string;
}

const BORDER = 2;

const StyledHeader = styled.header`
  position: relative;
  padding-top: calc(13px + ${BORDER}px);
  padding-bottom: 13px;
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
    background: linear-gradient(
      90deg,
      rgba(0, 255, 177, 1) 22%,
      rgba(0, 255, 211, 1) 74%
    );
  }
`;

// color: 'rgb(55,55,55)';
const Heading = styled.h1`
  font-weight: 100;
  font-family: 'Helvetica Neue', sans-serif;
  a {
    color: white;
  }
`;

const Header = ({ siteTitle = 'Prototype X' }: HeaderProps) => (
  <StyledHeader>
    <Container>
      <Heading style={{ margin: 0 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          {siteTitle}
        </Link>
      </Heading>
    </Container>
  </StyledHeader>
);

export default Header;
