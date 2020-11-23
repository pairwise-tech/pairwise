import React from "react";
import styled from "styled-components/macro";
import PairwiseLogo from "../icons/logo-square@1024.png";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface Coordinates {
  x: number;
  y: number;
}

interface IProps {}

interface IState {
  quote: Quote;
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
 * ============================================================================
 */

class PairwiseScreensaver extends React.Component<IProps, IState> {
  timer: any = null;
  interval: any = null;

  constructor(props: IProps) {
    super(props);

    this.state = {
      quoteBlockVisible: false,
      quote: this.getRandomQuote(),
      coordinates: this.getContentBlockCoordinates(),
    };
  }

  componentDidMount() {
    this.showQuote(500);

    this.interval = setInterval(this.updateQuote, 25000);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  showQuote = (delay: number) => {
    this.timer = setTimeout(
      () =>
        this.setState({
          quoteBlockVisible: true,
          quote: this.getRandomQuote(),
          coordinates: this.getContentBlockCoordinates(),
        }),
      delay,
    );
  };

  updateQuote = () => {
    this.setState({ quoteBlockVisible: false }, () => this.showQuote(1500));
  };

  getRandomQuote = () => {
    return QUOTES[getRandomNumber(0, QUOTES.length - 1)];
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

  render() {
    const { quote, quoteBlockVisible, coordinates } = this.state;
    return (
      <ScreensaverOverlay visible data-selector="pairwise-screensaver-overlay">
        <ContentBlock coordinates={coordinates} visible={quoteBlockVisible}>
          <img width={85} height={85} src={PairwiseLogo} alt="Pairwise Logo" />
          <QuoteBlock>
            <Quote>"{quote.text}"</Quote>
            <Author>― {quote.author}</Author>
          </QuoteBlock>
        </ContentBlock>
      </ScreensaverOverlay>
    );
  }
}

/** ===========================================================================
 * Quotes List
 * ============================================================================
 */

const QUOTES: Quote[] = [
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
  // {
  //   text: "",
  //   author: "",
  // },
  // {
  //   text: "",
  //   author: "",
  // },
  // {
  //   text: "",
  //   author: "",
  // },
  // {
  //   text: "",
  //   author: "",
  // },
  // {
  //   text: "",
  //   author: "",
  // },
  // {
  //   text: "",
  //   author: "",
  // },
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
  -webkit-transition: opacity 1s linear;
  -moz-transition: opacity 1s linear;
  -o-transition: opacity 1s linear;
  transition: opacity 1s linear;
`;

const QuoteBlock = styled.div`
  padding-left: 24px;
`;

const Quote = styled.p`
  font-family: "Courier New", Courier, monospace;
  color: white;
  font-size: 16px;
`;

const Author = styled.p`
  font-family: Verdana, Geneva, sans-serif;
  color: white;
  font-size: 14px;
`;

interface ScreensaverOverlayProps {
  visible: boolean;
}

/**
 * Gradient animation created with https://www.gradient-animator.com/.
 */
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

  background-size: 800% 800%;
  background: linear-gradient(270deg, #f3577a, #27c9dd, #ffb85a, #f6fa88);

  -webkit-animation: PairwiseScreensaver 120s ease infinite;
  -moz-animation: PairwiseScreensaver 120s ease infinite;
  animation: PairwiseScreensaver 120s ease infinite;

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
