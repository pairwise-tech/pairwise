import React from "react";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { getSearchResults } from "modules/challenges/selectors";
import styled from "styled-components/macro";
import { InputGroup } from "@blueprintjs/core";
import { SearchResult } from "modules/challenges/types";

const mapState = (state: ReduxStoreState) => ({
  searchResults: getSearchResults(state),
});

const dispatchProps = {
  requestSearchResults: Modules.actions.challenges.requestSearchResults,
};

type Props = ReturnType<typeof mapState> & typeof dispatchProps;

const SearchBox = ({ searchResults, requestSearchResults }: Props) => {
  const [searchText, setSearchText] = React.useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchText(value);
    requestSearchResults(value);
  };

  return (
    <Box>
      <Input
        fill
        leftIcon="search"
        id="search-input"
        onChange={handleChange}
        value={searchText}
        placeholder="Search..."
      />
      {searchResults.length > 0 && (
        <ResultBox>
          {searchResults.map(x => (
            <StyledSearchResultItem key={x.id} result={x} />
          ))}
          <ResultTitleBox>
            Showing {searchResults.length} results for "{searchText}"
          </ResultTitleBox>
        </ResultBox>
      )}
    </Box>
  );
};

const SearchResultItem = ({ result, ...rest }: { result: SearchResult }) => {
  return (
    <div {...rest}>
      <h3>{result.title}</h3>
      {result.matches.map((x, i) => {
        return (
          <p key={i}>
            {x.matchContext.beforeMatch}
            <span style={{ fontWeight: "bold", color: "#ffdf75" }}>
              {x.matchContext.match}
            </span>
            {x.matchContext.afterMatch}
          </p>
        );
      })}
    </div>
  );
};

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
  display: flex;
  align-items: center;
  box-shadow: 0 0px 12px rgba(0, 0, 0, 0.3);
}
`;

const StyledSearchResultItem = styled(SearchResultItem)`
  cursor: pointer;
  padding: 4px 10px;
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

const ResultBox = styled.div`
  position: absolute;
  top: 100%;
  left: auto;
  right: 0;
  z-index: 3;
  min-width: 400px;
  width: 100%;
  background: #3a3a3a;
  overflow: auto;
  max-height: 80vh;
  border-radius: 3px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.55);
  padding-bottom: ${SEARCH_TITLE_HEIGHT}px;
  border: 1px solid #4c4c4c;
`;

export default connect(mapState, dispatchProps)(SearchBox);
