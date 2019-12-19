import React from 'react';
import Typography from '@material-ui/core/Typography';

import { Section, SectionTitle } from '../components/components';
import Layout from '../components/Layout';

const Thanks = () => {
  return (
    <Layout>
      <Section>
        <SectionTitle>Frequently Asked Questions</SectionTitle>
        <Typography variant="h5">Sup</Typography>
        <Typography>Hey there text</Typography>
      </Section>
    </Layout>
  );
};

export default Thanks;
