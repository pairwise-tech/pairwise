import React from "react";
import { Button, Icon, Classes } from "@blueprintjs/core";
import styled from "styled-components/macro";
import { CSSTransition } from "react-transition-group";
import Confetti from "react-confetti";
import { IRect } from "react-confetti/dist/types/Rect";
import { Challenge, getChallengeSlug } from "@pairwise/common";
import { scrollToVideoAndPlay, scrollToContentArea } from "./MediaArea";
import Modules, { ReduxStoreState } from "modules/root";
import { NextChallengeButton } from "./ChallengeControls";
import { connect } from "react-redux";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { MOBILE } from "tools/constants";
import { withRouter, RouteComponentProps } from "react-router-dom";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface ConfettiModalProps extends RouteComponentProps {
  isOpen: boolean;
  onClose?: () => any;
  onClickOutside?: () => any;
  hideConfetti?: boolean;
}

const getDimensions = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

// The colors from our logo
const PAIRWISE_COLORS = ["#27C9DD", "#F3577A", "#F6FA88", "#49F480", "#FFB85A"];

/** ===========================================================================
 * Card Title Component
 * ============================================================================
 */

// The title text of the modal. Will animate along with the modal.
const CardTitle: React.FC<{ parentStage?: number }> = props => {
  const [stage, setStage] = React.useState(0);
  const nextStage = () => setStage(stage + 1);

  if (typeof props.parentStage !== "number") {
    console.warn(
      "[Err] CardTitle should only be used within a GreatSuccess component",
    );
    return null;
  }

  return (
    <CardTitleContainer>
      <CSSTransition
        in={props.parentStage > 1}
        timeout={300}
        classNames="gs"
        onEntered={nextStage}
        onExit={() => setStage(0)}
      >
        <Icon
          style={{
            margin: "0 60px",
            marginLeft: 40,
            color: "#09F9A4",
            transform: "scale(3)",
          }}
          intent="primary"
          iconSize={Icon.SIZE_LARGE}
          icon="tick"
        ></Icon>
      </CSSTransition>
      <CSSTransition
        in={stage > 0}
        timeout={500}
        classNames="gs"
        onEntered={nextStage}
      >
        <h1>{props.children}</h1>
      </CSSTransition>
    </CardTitleContainer>
  );
};

/** ===========================================================================
 * Confetti Modal Component
 * ============================================================================
 */

const ConfettiModal: React.FC<ConfettiModalProps> = props => {
  const { width, height } = getDimensions();
  // Default the confetti source to a rect at the center of the screen
  const contentRect = React.useRef<IRect>({
    x: width / 2,
    y: width / 2,
    w: 50,
    h: 50,
  });
  const [stage, setStage] = React.useState(0);
  const nextStage = () => setStage(stage + 1);
  React.useEffect(() => {
    // NOTE: We need to use an effect here to grab the DOM el because
    // CSSTransition doesn't like us adding a ref to children.
    const el = document.getElementById("confetti-measurement-div");
    if (el) {
      const box = el.getBoundingClientRect();
      contentRect.current = {
        x: box.x,
        y: box.y,
        w: box.width,
        h: box.height,
      };
    }
  }, [stage]);

  return (
    <CSSTransition
      in={props.isOpen}
      timeout={500}
      classNames="gs"
      unmountOnExit
      onEntered={nextStage}
      onExit={() => setStage(0)}
    >
      <GreatSuccessContainer>
        <Backdrop onClick={props.onClickOutside} />
        {stage > 2 && !props.hideConfetti && (
          <Confetti
            key="gs-confetti"
            width={width}
            height={height}
            style={{ zIndex: 6 }}
            colors={PAIRWISE_COLORS}
            initialVelocityX={4}
            initialVelocityY={15}
            confettiSource={contentRect.current}
          />
        )}
        <CSSTransition
          in={stage > 0}
          timeout={500}
          classNames="gs"
          unmountOnExit
          onEntered={nextStage}
        >
          <Content id="gs-card">
            <ParentDimensionMeasure id="confetti-measurement-div" />
            {props.onClose && (
              <CloseButton
                id="gs-card-close"
                onClick={props.onClose}
                icon="cross"
                minimal
              />
            )}
            <div className="inner">
              {React.Children.map(props.children, child => {
                // @ts-ignore What's going on here? Why are the official types not passing for child.type?
                if (child.type === CardTitle) {
                  // @ts-ignore Same as above. This is totally valid, not sure why TS is complaining
                  return React.cloneElement(child, { parentStage: stage });
                } else {
                  return child;
                }
              })}
            </div>
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

/** ===========================================================================
 * Great Success Component
 * ============================================================================
 */

interface GreatSuccessProps extends ConfettiModalProps {
  challenge: Challenge;
  onClose: () => any;
}

type Props = ReturnType<typeof mapStateToProps> &
  typeof dispatchProps &
  GreatSuccessProps;

const GreatSuccess: React.FC<Props> = ({
  challenge,
  nextChallenge,
  ...props
}) => {
  const { onClose } = props;

  const handleScrollToContent = React.useCallback(() => {
    onClose();
    scrollToContentArea();
  }, [onClose]);
  const handlePlayVideo = React.useCallback(() => {
    onClose();
    scrollToVideoAndPlay();
  }, [onClose]);

  // Proceed to next challenge
  const proceed = () => {
    if (nextChallenge) {
      const slug = getChallengeSlug(nextChallenge);
      props.history.push(`/workspace/${slug}`);
    }
  };

  return (
    <ConfettiModal {...props}>
      <KeyboardShortcuts
        keymap={{
          escape: onClose,
          enter: proceed,
        }}
      />
      <CardTitle>{challenge.title}</CardTitle>
      <p style={{ marginBottom: 20, fontSize: 20 }}>
        Congratulations, you've completed <strong>{challenge.title}</strong>.
        Keep up the progress!
      </p>
      <ButtonActions>
        <Button
          large
          icon="comment"
          className="feedback-button"
          onClick={() => props.setFeedbackDialogState(true)}
        >
          Have feedback?
        </Button>
        <div className="right-buttons">
          {challenge.content && (
            <Button large style={{ order: 3 }} onClick={handleScrollToContent}>
              View Content
            </Button>
          )}
          {challenge.videoUrl && (
            <Button
              large
              rightIcon="video"
              style={{ order: 2 }}
              onClick={handlePlayVideo}
            >
              Watch Video
            </Button>
          )}
          {nextChallenge && (
            <NextChallengeButton
              style={{
                order: 1,
                minWidth: 40,
                minHeight: 40,
                padding: "5px 15px",
                fontSize: 16,
              }}
              className={Classes.INTENT_SUCCESS}
              slug={getChallengeSlug(nextChallenge)}
            />
          )}
        </div>
      </ButtonActions>
    </ConfettiModal>
  );
};

const ButtonActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .right-buttons {
    margin-left: auto;
  }

  @media ${MOBILE} {
    flex-direction: column;

    button {
      width: 100%;
    }

    .feedback-button {
      order: 2;
    }

    .right-buttons {
      order: 1;
      display: flex;
      flex-direction: column;
      margin-left: 0;
      width: 100%;

      .bp3-intent-success {
        margin-bottom: 20px;
      }
    }
  }

  ${Classes.BUTTON} {
    margin-left: 10px;
  }
`;

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const CloseButton = styled(Button)`
  position: absolute;
  top: 20px;
  right: 20px;
`;

// Take up the full width and height of the parent el while remaining invisible.
// This is just for measurement purposes.
const ParentDimensionMeasure = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: transparent;
`;

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
`;

const Content = styled.div`
  transform-style: preserve-3d;
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
    transform: translate(0, 100%) scale(1.5) rotate3d(1, 0, 0, -55deg);
    opacity: 0;
  }
  &.gs-enter-active {
    transform: translate(0) scale(1);
    opacity: 1;
  }
  &.gs-exit-active {
    transform: translate(15%, -100%) scale(1) rotate3d(0, 0, 1, 25deg);
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
  perspective: 800px;
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
  opacity: 0;

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
    opacity: 1;
  }
`;

const CardTitleContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 22px;
  margin-bottom: 40px;

  @media ${MOBILE} {
    display: block;

    & > span {
      display: none;
    }

    h1 {
      font-size: 32px;
    }
  }

  h1,
  .bp3-icon {
    margin: 0;
    transition: all 300ms ease-out;
    opacity: 0;
    transform: translateX(-50px);

    &.gs-enter-active,
    &.gs-enter-done {
      transform: translateX(0px);
      opacity: 1;
    }
  }
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  nextChallenge: Modules.selectors.challenges.nextPrevChallenges(state).next,
});

const dispatchProps = {
  setFeedbackDialogState: Modules.actions.feedback.setFeedbackDialogState,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withRouter(
  connect(mapStateToProps, dispatchProps)(GreatSuccess),
);
