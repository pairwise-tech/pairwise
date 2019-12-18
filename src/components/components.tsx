import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import React, { ReactNode } from 'react';
import Typography, { TypographyProps } from '@material-ui/core/Typography';
import styled from 'styled-components';
import { CSSProperties, StyleRules } from '@material-ui/core/styles/withStyles';

interface SectionProps {
  alternate?: boolean;
  style?: React.CSSProperties;
}

// Desktop breakpoint, for use in styled components
export const DESKTOP = '@media (min-width: 768px)';

/**
 * propName -> prop-name
 */
const camelCaseToHpyhenCase = (s: string) => {
  return s
    .split(/([A-Z])/g) // Split on caps and capture the letter
    .reduce((agg, x, i) => agg + (i % 2 === 0 ? x : '-' + x.toLowerCase()));
};

/**
 * A helper for forwarding `style` properties from a parent component within the
 * context of styled components.
 *
 * NOTE: For the sake of typing the propName should be a in camelCase but styled
 * components wants hyphen-case so we need to do that transformation and it
 * still looks odd including camelCase names within the template. Still, since
 * TS will yell at you this shouldn't be an issue.
 */
const forwardStyleProp = (propName: keyof React.CSSProperties) => (
  props: SectionProps,
) => {
  return props.style && props.style[propName]
    ? `${camelCaseToHpyhenCase(propName)}: ${props.style.boxShadow};`
    : null;
};

const DARK_BG = '#2d2d2d';

/**
 * The primary reason for this component is to have full-width backgrounds
 * while still content to be wrapped by a parent component.
 */
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
    ${forwardStyleProp('boxShadow')}
    ${forwardStyleProp('border')}
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

const CodeRainBackground = styled.div`
  z-index: 1;
  background-image: url(${require('../images/cmatrix.jpg')});
  position: absolute;
  opacity: 0.07;
  top: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  bottom: 0;
`;

export const CodeRainSection = ({ children, ...props }: any) => {
  return (
    <Section {...props}>
      <CodeRainBackground />
      {/* Wrap the children in a z-higher div so that they don't have to remember this */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </Section>
  );
};
