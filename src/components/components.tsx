import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import React, { ReactNode } from 'react';
import Typography, { TypographyProps } from '@material-ui/core/Typography';
import styled from 'styled-components';
import { CSSProperties, StyleRules } from '@material-ui/core/styles/withStyles';

interface SectionProps {
  alternate?: boolean;
}

const DARK_BG = '#2d2d2d';

export const Section = styled(Container)`
  position: relative;
  padding-top: 80px;
  padding-bottom: 80px;
  background-color: ${(props: SectionProps) =>
    props.alternate ? '#ebf2f5' : DARK_BG};
  color: ${(props: SectionProps) => (props.alternate ? DARK_BG : 'white')};
  &:before,
  &:after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 100%;
    width: 1000px;
    background-color: ${(props: SectionProps) =>
      props.alternate ? '#ebf2f5' : DARK_BG};
  }
  &:before {
    left: auto;
    right: 100%;
  }
`;

export const SectionTitle = (props: {
  children: ReactNode;
  style?: React.CSSProperties;
}) => {
  return (
    <Typography
      variant="h3"
      style={{ marginBottom: 40, ...props.style }}
      {...props}
    />
  );
};

export const ActionButton = styled(Button)`
  background: linear-gradient(45deg, #fe6b8b 30%, #ff8e53 90%);
  border-radius: 3px;
  border: 0;
  color: white;
  height: 48px;
  padding-left: 30px !important;
  padding-right: 30px !important;
  box-shadow: '0 3px 5px 2px rgba(255, 105, 135, .3)';
`;
