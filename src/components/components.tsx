import Container from '@material-ui/core/Container';
import React, { ReactNode } from 'react';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

export const Section = styled(Container)`
  position: relative;
  padding-top: 80px;
  padding-bottom: 80px;
  background-color: ${(props: { alternate?: boolean }) =>
    props.alternate ? '#2d2d2d' : '#1d1d1d'};
  &:before,
  &:after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 100%;
    width: 1000px;
    background-color: ${(props: { alternate?: boolean }) =>
      props.alternate ? '#2d2d2d' : '#1d1d1d'};
  }
  &:before {
    left: auto;
    right: 100%;
  }
`;

export const SectionTitle = (props: { children: ReactNode }) => {
  return <Typography style={{ marginBottom: 40 }} variant="h3" {...props} />;
};
