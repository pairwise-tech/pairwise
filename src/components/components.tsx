import { CSSProperties } from '@material-ui/core/styles/withStyles';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Container from '@material-ui/core/Container';
import React, { ReactNode, FormEvent, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

interface SectionProps {
  alternate?: boolean;
  style?: React.CSSProperties;
}

// Desktop breakpoint, for use in styled components
export const DESKTOP = '@media (min-width: 768px)';

export const GREEN_GRADIENT = `
linear-gradient(
  90deg,
  rgba(0, 255, 177, 1) 22%,
  rgba(0, 255, 211, 1) 74%
)
`;

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
export const Section = styled(Container)<SectionProps>`
  position: relative;
  padding-top: 80px;
  padding-bottom: 80px;
  background-color: ${(props) => (props.alternate ? '#ebf2f5' : DARK_BG)};
  color: ${(props) => (props.alternate ? DARK_BG : 'white')};
  &:before,
  &:after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 100%;
    width: 1000px;
    background-color: ${(props) => (props.alternate ? '#ebf2f5' : DARK_BG)};
    ${forwardStyleProp('boxShadow')}
    ${forwardStyleProp('border')}
  }
  &:before {
    left: auto;
    right: 100%;
  }
`;

export const ConstrainWidth = styled.div`
  max-width: 700px;
  margin: ${(props: { center?: boolean }) => (props.center ? '0 auto' : '0')};
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

interface ActionButtonProps {
  loading?: boolean | undefined;
}

export const ActionButton = styled(Button)<ActionButtonProps>`
  background: ${({ loading }) =>
    loading ? '#404040' : `linear-gradient(45deg, #fe6b8b 30%, #ff8e53 90%)`};
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

interface RemoteFormProps {
  name: string;
  children: React.ReactNode;
  submitText?: string;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => any;
  onComplete?: () => void;
}

/**
 * Currently this is a netlify form, but we could potentially point it at some
 * other provider later.
 */
export const RemoteForm = (props: RemoteFormProps) => {
  const {
    onSubmit,
    onComplete,
    submitText = 'Submit',
    name,
    children,
    ...rest
  } = props;
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const el = e.currentTarget;
    const data = new FormData(el);

    setLoading(true);

    fetch(el.action, {
      method: 'POST',
      body: data, // Should be auto-formatted by browser
    })
      .then(onComplete)
      .finally(() => setLoading(false));

    if (onSubmit) onSubmit(e);
  };

  return (
    <form
      {...rest}
      name={name}
      action="/thanks/"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      method="POST"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="form-name" value={name} />
      <p style={{ display: 'none' }}>
        <input name="bot-field" />
      </p>
      {children}
      <ActionButton loading={loading} type="submit">
        {loading ? <CircularProgress size={24} color="primary" /> : submitText}
      </ActionButton>
    </form>
  );
};
