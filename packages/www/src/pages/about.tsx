import React from 'react';
import Markdown from 'react-markdown';
import styled from 'styled-components';

import { Section, SectionTitle } from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const DESCRIPTION = `
We're a team of two, self-taught software engineers that formerly worked together in San Francisco. This is the story of Pairwise.
`.trim();

const About = () => {
  return (
    <Layout>
      <SEO title="About Pairwise" description={DESCRIPTION} />
      <Section>
        <SectionTitle>About Pairwise</SectionTitle>
      </Section>
    </Layout>
  );
};

export default About;
