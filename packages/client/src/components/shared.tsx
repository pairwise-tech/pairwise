import React from "react";
import Markdown from "react-markdown";
import styled from "styled-components/macro";

import { COLORS } from "../tools/constants";
import { EditableText, IEditableTextProps } from "@blueprintjs/core";

export const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 25px;
`;

export const ButtonCore = styled.button`
  background: none repeat scroll 0 0 transparent;
  border: medium none;
  border-spacing: 0;
  font-family: "PT Sans Narrow", sans-serif;
  font-size: 16px;
  font-weight: normal;
  line-height: 1.42rem;
  list-style: none outside none;
  margin: 0;
  padding: 0;
  text-align: left;
  text-decoration: none;
  text-indent: 0;

  :focus {
    outline: none;
  }
`;

export const TitleInput = styled.input`
  outline: none;
  appearance: none;
  border: none;
  font-size: 1.2em;
  background: transparent;
  font-weight: bold;
  color: rgb(200, 200, 200);
  display: block;
  width: 100%;
  line-height: 1.5;
  transition: all 0.2s ease-out;
  &:focus {
    background: black;
  }
`;

export const ContentInput = styled((props: IEditableTextProps) => (
  <EditableText multiline minLines={3} {...props} />
))`
  outline: none;
  appearance: none;
  border: none;
  font-size: 1.2em;
  display: block;
  color: white;
  height: 100%;
  width: 100%;
  line-height: 1.5;
  background: transparent;
  transition: background 0.2s ease-out;
  &:focus {
    background: black;
  }
`;

export const StyledMarkdown = styled(Markdown)`
  color: white;
  line-height: 1.5;
  font-size: 1.2rem;

  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 1px 3px;
    display: inline;
    /* color: #ff4788; */
    color: rgb(0, 255, 185);
    border-radius: 3px;
    line-height: normal;
    font-size: 85%;
  }
`;

export const Text = styled.p`
  margin: 0;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 200px;
  color: ${COLORS.TEXT_CONTENT};
`;

export const LowerRight = styled.div`
  position: absolute;
  z-index: 2;
  right: 20px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
`;
