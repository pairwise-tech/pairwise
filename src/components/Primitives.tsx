import styled from "styled-components";

import { COLORS as C } from "../tools/constants";

export const Button = styled.button`
  border: none;
  width: 165px;
  margin-right: 12px;
  font-size: 14px;
  font-weight: 500px;
  padding: 6px 12px;
  border-radius: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.TEXT_TITLE};
  background: rgb(11, 79, 147);
  background: linear-gradient(
    63deg,
    rgba(11, 79, 147, 1) 15%,
    rgba(17, 182, 237, 0.5) 85%
  );

  :hover {
    cursor: pointer;
    color: ${C.TEXT_HOVER};
    background: rgb(23, 94, 164);
    background: linear-gradient(
      63deg,
      rgba(10, 100, 215, 1) 15%,
      rgba(17, 195, 240, 0.65) 85%
    );
  }

  :focus {
    outline: none;
  }
`;

/* TODO: Change the styles */
export const SecondaryButton = styled.button`
  border: none;
  width: 85px;
  margin-right: 12px;
  font-size: 14px;
  font-weight: 500px;
  padding: 6px 12px;
  border-radius: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.TEXT_TITLE};
  background: rgb(11, 79, 147);
  background: linear-gradient(
    63deg,
    rgba(11, 79, 147, 1) 15%,
    rgba(17, 182, 237, 0.5) 85%
  );

  :hover {
    cursor: pointer;
    color: ${C.TEXT_HOVER};
    background: rgb(23, 94, 164);
    background: linear-gradient(
      63deg,
      rgba(10, 100, 215, 1) 15%,
      rgba(17, 195, 240, 0.65) 85%
    );
  }

  :focus {
    outline: none;
  }
`;
