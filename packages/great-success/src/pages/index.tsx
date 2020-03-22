import React from 'react';

import Layout from '../components/Layout';
import { Button, Classes } from '@blueprintjs/core';
import styled from 'styled-components';
import { CSSTransition } from 'react-transition-group';

interface GreatSuccessProps {
  isOpen: boolean;
  onClose?: () => any;
  onClickOutside?: () => any;
}

const GreatSuccess: React.FC<GreatSuccessProps> = (props) => {
  const [stage, setStage] = React.useState(0);
  const nextStage = () => setStage(stage + 1);
  // const prevStage = () => setStage(stage - 1);

  return (
    <CSSTransition
      in={props.isOpen}
      timeout={500}
      classNames="gs"
      unmountOnExit
      onEntered={nextStage}
      onExit={() => setStage(0)}
      // onExited={() => setShowButton(true)}
    >
      <GreatSuccessContainer>
        <Backdrop onClick={props.onClickOutside} />
        <CSSTransition
          in={stage > 0}
          timeout={500}
          classNames="gs"
          unmountOnExit
          onEntered={nextStage}
        >
          <Content>
            <Button onClick={props.onClose} icon="cross" minimal></Button>
            <div className="inner">{props.children}</div>
            <CSSTransition
              in={stage > 1}
              timeout={1000}
              classNames="gs"
              unmountOnExit
              onEntering={nextStage}
            >
              <ContentOutline />
            </CSSTransition>
          </Content>
        </CSSTransition>
      </GreatSuccessContainer>
    </CSSTransition>
  );
};

const ContentOutline = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 6;
  pointer-events: none;
  transition: all 1000ms ease-out;
  border-radius: 5px;
  &.gs-enter {
    box-shadow: 0 0 30px 50px rgba(5, 250, 174, 0);
  }
  &.gs-enter-active {
    box-shadow: 0 0 0 8px rgba(5, 250, 174, 1);
  }
  &.gs-enter-done {
    box-shadow: 0 0 0 8px rgba(5, 250, 174, 1);
  }
  // &.gs-enter-done {
  //   box-shadow: 0 0 30px 8px rgba(5, 250, 174, 0.6);
  //   background-color: rgba(5, 250, 174, 0.6);
  //   transform: scale(2);
  //   opacity: 0;
  // }
`;

const Content = styled.div`
  position: relative;
  z-index: 7;
  transition: all 500ms ease-out;

  padding: 40px;
  background: #222;
  border-radius: 5px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  width: 80%;
  margin: 0 auto;

  &.inner {
    position: relative;
    z-index: 9;
  }

  &.gs-enter {
    transform: translate(0, 100%) scale(1.5);
    opacity: 0;
  }
  &.gs-enter-active {
    transform: translate(0) scale(1);
    opacity: 1;
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
  transition: all 500ms ease-out;

  // Initial
  &.gs-enter {
    opacity: 0;
  }

  // Transitioning
  &.gs-enter-active {
    opacity: 1;
  }

  // Done
  &.gs-enter-done {
  }
`;

const IndexPage: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
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
        <GreatSuccess
          isOpen={isOpen}
          onClose={handleClose}
          onClickOutside={handleClose}
        >
          <h1>Done! You did it.</h1>
          <p>That was a great success</p>
        </GreatSuccess>
        <Button onClick={() => setIsOpen(true)}>Open It!</Button>
      </div>
    </Layout>
  );
};

export default IndexPage;
