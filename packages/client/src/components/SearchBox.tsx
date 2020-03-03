import React from "react";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { getSearchResults } from "modules/challenges/selectors";
import styled from "styled-components/macro";
import { InputGroup } from "@blueprintjs/core";

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
      <ResultBox>
        {searchResults.map(x => {
          return <p key={x.ref}>{x.ref}</p>;
        })}
      </ResultBox>
    </Box>
  );
};

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
  background: skyblue;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1;
`;

export default connect(mapState, dispatchProps)(SearchBox);
