import React from "react";
import { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { InputGroup } from "@blueprintjs/core";
import { KeyboardShortcuts } from "./AdminKeyboardShortcuts";
import cx from "classnames";
import { COLORS } from "../tools/constants";
import toaster from "../tools/toast-utils";

/** ===========================================================================
 * AdminSearchBox Component
 * ============================================================================
 */

// NOTE: isClosed is kept in state because sometimes we want the search pane to
// be closed even if there are search results. For example, the user clicks
// outside the search pane. In such a case there are still results but we don't
// want to show the pane. When the search pane is focused we always show the
// result box, so we can report when there are no search results to the user.
const AdminSearchBox = ({ onBlur, onFocus }: Props) => {
  const [searchText, setSearchText] = React.useState("");
  const [isClosed, setIsClosed] = React.useState(false); // See NOTE

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
      // What is this linting? We need to know onFocus is defined, it's not unused at all.
      // tslint:disable-next-line: no-unused-expression
      onFocus && onFocus(e);
    },
    [setIsClosed, onFocus],
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
        toaster.warn("Search Coming Soon...");
      }
    },
    [searchText],
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
        onBlur={onBlur}
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
      color: ${COLORS.TEXT_CONTENT};
    }

    :-ms-input-placeholder {
      color: ${COLORS.TEXT_CONTENT};
    }

    ::-ms-input-placeholder {
      color: ${COLORS.TEXT_CONTENT};
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

interface OwnProps {
  onBlur?: (e: any) => any;
  onFocus?: (e: any) => any;
}

type Props = ReturnType<typeof mapStateToProps> &
  typeof dispatchProps &
  OwnProps;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(mapStateToProps, dispatchProps)(AdminSearchBox);
