import { Link } from 'gatsby';
import Container from '@material-ui/core/Container';
import React from 'react';
import styled from 'styled-components';

interface HeaderProps {
  siteTitle: string;
}

const StyledHeader = styled.header`
  padding-top: 10px;
  padding-bottom: 10px;
  margin-bottom: 1.45rem;
  background: rgb(61, 209, 168);
  background: linear-gradient(
    90deg,
    rgba(61, 209, 168, 1) 42%,
    rgba(0, 255, 185, 1) 87%
  );
`;

const Header = ({ siteTitle }: HeaderProps) => (
  <StyledHeader>
    <Container>
      <h1 style={{ margin: 0 }}>
        <Link
          to="/"
          style={{
            color: `white`,
            textDecoration: `none`,
          }}
        >
          {siteTitle}
        </Link>
      </h1>
    </Container>
  </StyledHeader>
);

export default Header;
