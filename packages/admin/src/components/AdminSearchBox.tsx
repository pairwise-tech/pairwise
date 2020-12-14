import React from "react";
import { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { InputGroup } from "@blueprintjs/core";
import { KeyboardShortcuts } from "./AdminKeyboardShortcuts";
import cx from "classnames";
import { COLORS } from "../tools/constants";
import { withRouter, RouteComponentProps } from "react-router-dom";

/** ===========================================================================
 * AdminSearchBox Component
 * ============================================================================
 */

const AdminSearchBox = (props: Props) => {
  const [searchText, setSearchText] = React.useState("");
  const [isClosed, setIsClosed] = React.useState(false);

  let searchInput: Nullable<HTMLInputElement> = null;

  const focusInput = (e: KeyboardEvent) => {
    e.preventDefault();
    searchInput?.focus();
  };

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

  const handleFocus = React.useCallback(
    (e: any) => {
      setIsClosed(false);
    },
    [setIsClosed],
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setSearchText(value);
      setIsClosed(false);
    },
    [],
  );

  // Handle Enter to trigger search
  const handleKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !!searchText) {
        searchInput?.blur();
        props.history.push(`/search/${searchText}`);
        setSearchText("");
      } else if (e.key === "Escape") {
        searchInput?.blur();
        setSearchText("");
      }
    },
    [searchText, searchInput, props.history],
  );

  return (
    <Box
      className={cx({ isClosed })}
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
        onKeyDown={handleKeyPress}
        value={searchText}
        placeholder="Enter a challenge id, user uuid, email, etc."
        onFocus={handleFocus}
        inputRef={(ref: HTMLInputElement | null) => {
          searchInput = ref;
        }}
      />
      <KeyboardShortcuts
        keymap={{
          "cmd+p": focusInput,
        }}
      />
    </Box>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

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
      border: none;
      outline: none;
      color: white;
    }

    ::placeholder {
      color: ${COLORS.TEXT_PLACEHOLDER};
    }

    :-ms-input-placeholder {
      color: ${COLORS.TEXT_PLACEHOLDER};
    }

    ::-ms-input-placeholder {
      color: ${COLORS.TEXT_PLACEHOLDER};
    }
  }
`;

const Box = styled.div`
  flex: 1 100%;
  max-width: 350px;
  position: relative;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({});

const dispatchProps = {};

type Props = ReturnType<typeof mapStateToProps> &
  typeof dispatchProps &
  RouteComponentProps;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withRouter(
  connect(mapStateToProps, dispatchProps)(AdminSearchBox),
);
