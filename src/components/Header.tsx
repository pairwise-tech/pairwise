import { Link } from 'gatsby';
import Container from '@material-ui/core/Container';
import React from 'react';
import styled from 'styled-components';

interface HeaderProps {
  siteTitle: string;
}

const StyledHeader = styled.header`
  padding-top: 13px;
  padding-bottom: 13px;
  margin-bottom: 1.45rem;
  background: rgb(61, 209, 168);
  background: linear-gradient(
    90deg,
    rgba(0, 255, 177, 1) 22%,
    rgba(0, 255, 211, 1) 74%
  );
`;

const Header = ({ siteTitle }: HeaderProps) => (
  <StyledHeader>
    <Container>
      <h1 style={{ margin: 0 }}>
        <Link
          to="/"
          style={{
            color: 'rgb(55,55,55)',
            textDecoration: 'none',
          }}
        >
          {siteTitle}
        </Link>
      </h1>
    </Container>
  </StyledHeader>
);

export default Header;
