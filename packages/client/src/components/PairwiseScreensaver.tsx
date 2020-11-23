import React from "react";
import styled from "styled-components/macro";
import PairwiseLogo from "../icons/logo-square@1024.png";
import { setScreensaverState } from "../modules/app/actions";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface Coordinates {
  x: number;
  y: number;
}

interface IProps {
  setScreensaverState: typeof setScreensaverState;
}

interface IState {
  quotes: Quote[];
  coordinates: Coordinates;
  quoteBlockVisible: boolean;
}

interface Quote {
  text: string;
  author: string;
}

const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min) + min);
};

/** ===========================================================================
 * Pairwise Screensaver Component
 * ----------------------------------------------------------------------------
 * - Gradient animation created with https://www.gradient-animator.com/.
 * ============================================================================
 */

class PairwiseScreensaver extends React.Component<IProps, IState> {
  timer: any = null;
  interval: any = null;

  constructor(props: IProps) {
    super(props);

    this.state = {
      quoteBlockVisible: false,
      quotes: this.shuffleQuotesList(),
      coordinates: this.getContentBlockCoordinates(),
    };
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeypress);

    this.showQuote(500);

    this.interval = setInterval(this.updateQuote, 12500);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  shuffleQuotesList = () => {
    return QUOTE_LIST.slice().sort(() => 0.5 - Math.random());
  };

  render() {
    const { quotes, quoteBlockVisible, coordinates } = this.state;
    const quote = quotes[0];
    return (
      <ScreensaverOverlay visible data-selector="pairwise-screensaver-overlay">
        <ContentBlock coordinates={coordinates} visible={quoteBlockVisible}>
          <img width={85} height={85} src={PairwiseLogo} alt="Pairwise Logo" />
          <QuoteBlock>
            <QuoteText>“{quote.text}”</QuoteText>
            <Author>― {quote.author}</Author>
          </QuoteBlock>
        </ContentBlock>
        <DismissText>Pairwise Screensaver | Press ESC to exit.</DismissText>
      </ScreensaverOverlay>
    );
  }

  handleKeypress = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.props.setScreensaverState(false);
    }
  };

  showQuote = (delay: number) => {
    this.timer = setTimeout(() => {
      this.setState(ps => {
        if (ps.quotes.length === 1) {
          return {
            quoteBlockVisible: true,
            quotes: this.shuffleQuotesList(),
            coordinates: this.getContentBlockCoordinates(),
          };
        } else {
          return {
            quoteBlockVisible: true,
            quotes: ps.quotes.slice(1),
            coordinates: this.getContentBlockCoordinates(),
          };
        }
      });
    }, delay);
  };

  updateQuote = () => {
    this.setState({ quoteBlockVisible: false }, () => this.showQuote(1500));
  };

  getContentBlockCoordinates = () => {
    const x = window.innerWidth;
    const y = window.innerHeight;
    const coordinates = {
      x: getRandomNumber(50, x - 650),
      y: getRandomNumber(50, y - 250),
    };
    return coordinates;
  };
}

/** ===========================================================================
 * Quotes List
 * ============================================================================
 */

const QUOTE_LIST: Quote[] = [
  {
    text:
      "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
  },
  {
    text:
      "Everyone knows that debugging is twice as hard as writing a program in the first place. So if you're as clever as you can be when you write it, how will you ever debug it?",
    author: "Brian Kernighan",
  },
  {
    text:
      "Is it possible that software is not like anything else, that it is meant to be discarded: that the whole point is to always see it as a soap bubble?",
    author: "Alan J Perlis",
  },
  {
    text: "If you optimize everything, you will always be unhappy.",
    author: "Donald Knuth",
  },
  {
    text:
      "Take time to learn the closest thing that we have to a SUPERPOWER - Code.",
    author: "Sharen Eddings",
  },
  {
    text:
      "Delivering good software today is often better than perfect software tomorrow, so finish things and ship.",
    author: "David Thomas",
  },
  {
    text:
      "Programming isn't about what you know; it's about what you can figure out.",
    author: "Chris Pine",
  },
  {
    text:
      "When to use iterative development? You should use iterative development only on projects that you want to succeed.",
    author: "Martin Fowler",
  },
  {
    text: "Make it work, make it right, make it fast.",
    author: "Kent Beck",
  },
  {
    text: "Deleted code is debugged code.",
    author: "Jeff Sickel",
  },
  {
    text:
      "If debugging is the process of removing software bugs, then programming must be the process of putting them in.",
    author: "Edsger Dijkstra",
  },
];

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ContentBlock = styled.div<{ visible: boolean; coordinates: Coordinates }>`
  padding: 20px;
  top: ${props => props.coordinates.y}px;
  left: ${props => props.coordinates.x}px;
  width: 600px;
  min-height: 150px;
  position: absolute;
  border-radius: 8px;
  display: flex;
  align-items: center;
  background-color: rgba(15, 15, 15, 0.875);
  opacity: ${(props: { visible: boolean }) => (props.visible ? 1 : 0)};
  -webkit-transition: opacity 1500ms linear;
  -moz-transition: opacity 1500ms linear;
  -o-transition: opacity 1500ms linear;
  transition: opacity 1500ms linear;
`;

const QuoteBlock = styled.div`
  padding-left: 24px;
`;

const QuoteText = styled.p`
  color: white;
  font-size: 16px;
  font-family: "Courier New", Courier, monospace;
`;

const Author = styled.p`
  color: white;
  font-size: 14px;
  font-family: Verdana, Geneva, sans-serif;
`;

const DismissText = styled.p`
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  color: rgb(25, 25, 25);
`;

interface ScreensaverOverlayProps {
  visible: boolean;
}

const ScreensaverOverlay = styled.div<ScreensaverOverlayProps>`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100vh;
  position: fixed;
  z-index: 1500;
  overflow: hidden;
  visibility: ${({ visible = true }: { visible?: boolean }) =>
    visible ? "visible" : "hidden"};

  background: linear-gradient(270deg, #f3577a, #27c9dd, #ffb85a, #f6fa88);
  background-size: 600% 600%;

  -webkit-animation: PairwiseScreensaver 60s ease infinite;
  -moz-animation: PairwiseScreensaver 60s ease infinite;
  animation: PairwiseScreensaver 60s ease infinite;

  @-webkit-keyframes PairwiseScreensaver {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  @-moz-keyframes PairwiseScreensaver {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  @keyframes PairwiseScreensaver {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default PairwiseScreensaver;
