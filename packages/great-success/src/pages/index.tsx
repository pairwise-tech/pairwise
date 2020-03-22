import React from 'react';

import Layout from '../components/Layout';
import { Button, Classes } from '@blueprintjs/core';
import styled from 'styled-components';

interface GreatSuccessProps {
  isOpen: boolean;
  onClose?: () => any;
}

const GreatSuccess: React.FC<GreatSuccessProps> = (props) => {
  const handleClickOutside = () => {
    console.log('Clicked outside');
  };

  return (
    <GreatSuccessContainer>
      <Backdrop onClick={handleClickOutside} />
      <Content>{props.children}</Content>
    </GreatSuccessContainer>
  );
};

const Content = styled.div`
  position: relative;
  z-index: 7;
  transition: all 0.5s ease-out;

  padding: 40px;
  background: blue;
  border-radius: 5px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  width: 80%;
  margin: 0 auto;
  transform: translate(0) scale(1);
  opacity: 1;

  &:hover {
    transform: translate(0, 40%) scale(1.2);
    opacity: 0;
  }
`;

const Backdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 6;
`;

const GreatSuccessContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const IndexPage: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(true);
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Layout>
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        className={Classes.DARK}
      >
        <GreatSuccess isOpen={isOpen} onClose={handleClose}>
          <h1>Done! You did it.</h1>
          <p>That was a great success</p>
        </GreatSuccess>
        <Button onClick={() => setIsOpen(true)}>Open It!</Button>
      </div>
    </Layout>
  );
};

export default IndexPage;
