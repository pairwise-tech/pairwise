import React from "react";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { getSearchResults } from "modules/challenges/selectors";
import styled from "styled-components/macro";
import { InputGroup } from "@blueprintjs/core";
import { SearchResult } from "modules/challenges/types";
import reactStringReplace from "react-string-replace";
import { useHistory } from "react-router-dom";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { MOBILE } from "tools/constants";

// NOTE: isClosed is kept in state rather than simply using the presence of
// search results becuase sometimes we want the search pane to be closed even if
// there are search results. For example, the user clicks outside the search
// pane. In such a case there are still results but we don't want to show the
// pane.
const SearchBox = ({ searchResults, requestSearchResults }: Props) => {
  const history = useHistory();
  const [searchText, setSearchText] = React.useState("");
  const [isClosed, setIsClosed] = React.useState(false); // See NOTE
  const [selIndex, setSelIndex] = React.useState(0);
  const handleClose = React.useCallback(() => {
    if (!isClosed) {
      setIsClosed(true);
    }
  }, [isClosed, setIsClosed]);
  React.useEffect(() => {
    document.addEventListener("click", handleClose);
    return () => {
      document.removeEventListener("click", handleClose);
    };
  }, [isClosed, handleClose]);
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setSearchText(value);
      setSelIndex(0);
      setIsClosed(false);
      requestSearchResults(value);
    },
    [requestSearchResults],
  );
  const handleNavigation = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement> | KeyboardEvent) => {
      const searchResultItem = searchResults[selIndex];
      if (searchResultItem) {
        e.preventDefault();
        const challengeId = searchResultItem.id;
        setSearchText(""); // Clear search
        handleClose();
        history.push(`/workspace/${challengeId}`);
      }
    },
    [history, searchResults, selIndex, handleClose],
  );
  const handleMouseEnter = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.target as HTMLDivElement;
      const index = el.dataset.index;
      if (index) {
        setSelIndex(Number(index));
      }
    },
    [],
  );
  const selNext = React.useCallback(() => {
    const total = searchResults.length;
    let next = selIndex + 1;
    if (next >= total) {
      next = 0;
    }
    setSelIndex(next);
  }, [searchResults.length, selIndex]);
  const selPrev = React.useCallback(() => {
    const total = searchResults.length;
    let prev = selIndex - 1;
    if (prev < 0) {
      prev = total - 1;
    }
    setSelIndex(prev);
  }, [searchResults.length, selIndex]);

  // See isClosed above if it makes no sense having both
  const isOpen = !isClosed && searchResults.length > 0;

  return (
    <Box
      onClick={e => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation(); // Necessary to prevent the background click which is outside the react event system
      }}
    >
      <Input
        fill
        leftIcon="search"
        id="search-input"
        autoComplete="off"
        onChange={handleChange}
        value={searchText}
        placeholder="Search..."
        onFocus={e => {
          setIsClosed(false);
        }}
      />
      {isOpen && (
        <ResultBox>
          <ScrollDiv>
            {searchResults.map((x, i) => (
              <StyledSearchResultItem
                key={x.id}
                data-index={i}
                data-challenge-id={x.id}
                active={selIndex === i}
                result={x}
                searchText={searchText}
                onClick={handleNavigation}
                onMouseEnter={handleMouseEnter}
              />
            ))}
          </ScrollDiv>
          <ResultTitleBox>
            Showing {searchResults.length} results for "{searchText}"
          </ResultTitleBox>
        </ResultBox>
      )}
      {/* These keyboard shortcuts only apply when the search pane is open */}
      {isOpen && (
        <KeyboardShortcuts
          keymap={{
            ArrowUp: selPrev,
            ArrowDown: selNext,
            Enter: handleNavigation,
            Escape: handleClose,
          }}
        />
      )}
    </Box>
  );
};

const underlineText = (fullString: string, subString: string) => {
  return reactStringReplace(fullString, subString, (x, i) => (
    <Underline key={i}>{x}</Underline>
  ));
};

interface SearchResultItemProps extends React.HTMLAttributes<HTMLDivElement> {
  result: SearchResult;
  searchText: string;
  active: boolean;
}

const SearchResultItem = ({
  result,
  searchText,
  active,
  ...rest
}: SearchResultItemProps) => {
  return (
    <div {...rest}>
      <h3>{underlineText(result.title, searchText)}</h3>
      {result.matches
        .filter(x => x.foundIn !== "title") // Skip title matches, since we display the title above
        .map((x, i) => {
          return (
            <LineWrappedText key={i}>
              {x.matchContext.beforeMatch}
              <YellowText>{x.matchContext.match}</YellowText>
              {x.matchContext.afterMatch}
            </LineWrappedText>
          );
        })}
    </div>
  );
};

const ScrollDiv = styled.div`
  flex: 1 100%;
  overflow: auto;
`;

const Underline = styled.span`
  text-decoration: underline;
`;

const LineWrappedText = styled.p`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const YellowText = styled.span`
  font-weight: bold;
  color: #ffdf75;
`;

const SEARCH_TITLE_HEIGHT = 30;

const ResultTitleBox = styled.div`
  background: #6d6d6d;
  font-weight: bold;
  padding: 0px 8px;
  height: ${SEARCH_TITLE_HEIGHT}px;
  position: absolute;
  top: auto;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  box-shadow: 0 0px 12px rgba(0, 0, 0, 0.3);
`;

// NOTE: Pointer events are disabled on all children to avoid issues with
// onMouseEnter. The child components also fire events on enter which ends up
// causing issues when we expect events only to be fired when the mouse enters
// this specific component at the top level
const StyledSearchResultItem = styled(SearchResultItem)`
  padding: 4px 10px;
  cursor: pointer;
  border-bottom: 1px solid #636363;
  background: ${props => (props.active ? "#4c4c4c" : "transparent")};
  /* See NOTE */
  & > * {
    pointer-events: none;
  }
  h3 {
    margin: 0;
    margin-bottom: 4px;
  }
  p {
    margin-bottom: 0;
  }
`;

const Input = styled(InputGroup)`
  input#search-input {
    color: white;
    transition: all 0.15s ease-out;
    background: #3a3a3a;
    width: 100%;
    display: block;
    &:hover {
      box-shadow: 0 0 0 1px #10ca92, 0 0 0 1px #10ca92,
        0 0 0 3px rgba(16, 202, 146, 0.1), inset 0 0 0 1px rgba(16, 22, 26, 0.1),
        inset 0 1px 1px rgba(16, 22, 26, 0.1);
    }
    &:focus {
      color: black;
      background: white;
    }
  }
`;

const Box = styled.div`
  position: relative;
  flex: 1 100%;
  margin-right: auto;
  max-width: 700px;
`;

// NOTE: The z-index on this is meant to make it appaer above the nav overlay
const ResultBox = styled.div`
  display: flex;
  flex-direction: column;
  z-index: 15;
  position: absolute;
  top: 100%;
  left: auto;
  right: 0;
  min-width: 300px;
  width: 100%;
  background: #3a3a3a;
  max-height: 80vh;
  border-radius: 3px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.55);
  padding-bottom: ${SEARCH_TITLE_HEIGHT}px;
  border: 1px solid #4c4c4c;
  @media ${MOBILE} {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const mapStateToProps = (state: ReduxStoreState) => ({
  searchResults: getSearchResults(state),
});

const dispatchProps = {
  requestSearchResults: Modules.actions.challenges.requestSearchResults,
};

type Props = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

export default connect(mapStateToProps, dispatchProps)(SearchBox);
