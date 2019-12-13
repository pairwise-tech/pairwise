import Container from '@material-ui/core/Container';
import React from 'react';
import styled from 'styled-components';

const Section = styled(Container)`
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

export default Section;
