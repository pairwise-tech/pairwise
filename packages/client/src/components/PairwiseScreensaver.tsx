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
  angle: number;
  gradient: Gradient;
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
      angle: getRandomNumber(60, 300),
      coordinates: this.getContentBlockCoordinates(),
      gradient: GRADIENTS[getRandomNumber(0, GRADIENTS.length)],
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

    document.removeEventListener("keydown", this.handleKeypress);
  }

  render() {
    const { quotes, angle, gradient, coordinates, quoteBlockVisible } =
      this.state;
    const quote = quotes[0];
    return (
      <ScreensaverOverlay
        angle={angle}
        gradient={gradient}
        data-selector="pairwise-screensaver-overlay"
      >
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

  shuffleQuotesList = () => {
    return QUOTE_LIST.slice().sort(() => 0.5 - Math.random());
  };

  showQuote = (delay: number) => {
    this.timer = setTimeout(() => {
      this.setState((ps) => {
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
    text: "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
  },
  {
    text: "Everyone knows that debugging is twice as hard as writing a program in the first place. So if you're as clever as you can be when you write it, how will you ever debug it?",
    author: "Brian Kernighan",
  },
  {
    text: "Is it possible that software is not like anything else, that it is meant to be discarded: that the whole point is to always see it as a soap bubble?",
    author: "Alan J Perlis",
  },
  {
    text: "If you optimize everything, you will always be unhappy.",
    author: "Donald Knuth",
  },
  {
    text: "Take time to learn the closest thing that we have to a SUPERPOWER - Code.",
    author: "Sharen Eddings",
  },
  {
    text: "Delivering good software today is often better than perfect software tomorrow, so finish things and ship.",
    author: "David Thomas",
  },
  {
    text: "Programming isn't about what you know; it's about what you can figure out.",
    author: "Chris Pine",
  },
  {
    text: "When to use iterative development? You should use iterative development only on projects that you want to succeed.",
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
    text: "If debugging is the process of removing software bugs, then programming must be the process of putting them in.",
    author: "Edsger Dijkstra",
  },
  {
    text: "Testing shows the presence, not the absence of bugs.",
    author: "Edsger Dijkstra",
  },
  {
    text: "Computers are good at following instructions, but not at reading your mind.",
    author: "Donald Knuth",
  },
  {
    text: "Computers are incredibly fast, accurate and stupid. Human beings are incredibly slow, inaccurate and brilliant. Together they are powerful beyond imagination.",
    author: "Albert Einstein",
  },
  {
    text: "Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it.",
    author: "Brian Kernighan",
  },
  {
    text: "Inside every well-written large program is a well-written small program.",
    author: "Tony Hoare",
  },
  {
    text: "Everybody should learn to program a computer, because it teaches you how to think.",
    author: "Steve Jobs",
  },
  {
    text: "Whether you want to uncover the secrets of the universe, or you just want to pursue a career in the 21st century, basic computer programming is an essential skill to learn.",
    author: "Stephen Hawking",
  },
  {
    text: "I think it's fair to say that personal computers have become the most empowering tool we've ever created. They're tools of communication, they're tools of creativity, and they can be shaped by their user.",
    author: "Bill Gates",
  },
];

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ContentBlock = styled.div<{ visible: boolean; coordinates: Coordinates }>`
  padding: 20px;
  top: ${(props) => props.coordinates.y}px;
  left: ${(props) => props.coordinates.x}px;
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

interface Gradient {
  colors: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
}

const GRADIENTS: Gradient[] = [
  {
    colors: {
      a: "#f3577a",
      b: "#27c9dd",
      c: "#ffb85a",
      d: "#f6fa88",
    },
  },
  {
    colors: {
      a: "#4af0bb",
      b: "#47f5e1",
      c: "#59d478",
      d: "#27cc84",
    },
  },
  {
    colors: {
      a: "#4284f5",
      b: "#3faef2",
      c: "#3be5f7",
      d: "#27c9dd",
    },
  },
];

interface ScreensaverOverlayProps {
  angle: number;
  gradient: Gradient;
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

  background: ${(props) => {
    const { a, b, c, d } = props.gradient.colors;
    return `linear-gradient(${props.angle}deg, ${a}, ${b}, ${c}, ${d})`;
  }};
  background-size: 600% 600%;
  animation: PairwiseScreensaver 60s ease infinite;
  -moz-animation: PairwiseScreensaver 60s ease infinite;
  -webkit-animation: PairwiseScreensaver 60s ease infinite;

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
