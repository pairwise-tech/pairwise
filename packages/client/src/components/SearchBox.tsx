import React from "react";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { getSearchResults } from "modules/challenges/selectors";
import styled from "styled-components/macro";
import { InputGroup } from "@blueprintjs/core";
import { SearchResult } from "modules/challenges/types";
import reactStringReplace from "react-string-replace";
import { useHistory } from "react-router-dom";

const SearchBox = ({ searchResults, requestSearchResults }: Props) => {
  const history = useHistory();
  const [searchText, setSearchText] = React.useState("");
  const [isClosed, setIsClosed] = React.useState(false);
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (!isClosed) {
        setIsClosed(true);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isClosed]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchText(value);
    requestSearchResults(value);
  };
  const handleNavigation = (challengeId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchText("");
    if (!isClosed) {
      setIsClosed(true);
    }

    history.push(`/workspace/${challengeId}`);
  };

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
      {!isClosed && searchResults.length > 0 && (
        <ResultBox>
          <ScrollDiv>
            {searchResults.map(x => (
              <StyledSearchResultItem
                key={x.id}
                result={x}
                searchText={searchText}
                onClick={handleNavigation(x.id)}
              />
            ))}
          </ScrollDiv>
          <ResultTitleBox>
            Showing {searchResults.length} results for "{searchText}"
          </ResultTitleBox>
        </ResultBox>
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
}

const SearchResultItem = ({
  result,
  searchText,
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

const StyledSearchResultItem = styled(SearchResultItem)`
  padding: 4px 10px;
  cursor: pointer;
  border-bottom: 1px solid #636363;
  &:hover {
    background: #4c4c4c;
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
        0 0 0 3px rgba(16, 202, 146, 0.3), inset 0 0 0 1px rgba(16, 22, 26, 0.3),
        inset 0 1px 1px rgba(16, 22, 26, 0.4);
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
  margin-right: 20px;
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
  min-width: 400px;
  width: 100%;
  background: #3a3a3a;
  max-height: 80vh;
  border-radius: 3px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.55);
  padding-bottom: ${SEARCH_TITLE_HEIGHT}px;
  border: 1px solid #4c4c4c;
`;

const mapState = (state: ReduxStoreState) => ({
  searchResults: getSearchResults(state),
});

const dispatchProps = {
  requestSearchResults: Modules.actions.challenges.requestSearchResults,
};

type Props = ReturnType<typeof mapState> & typeof dispatchProps;

export default connect(mapState, dispatchProps)(SearchBox);
