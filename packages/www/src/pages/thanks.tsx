import React from 'react';
import Typography from '@material-ui/core/Typography';

import {
  ConstrainWidth,
  Section,
  SectionTitle,
  ActionButton,
} from '../components/components';
import Layout from '../components/Layout';

const Thanks = () => {
  return (
    <Layout>
      <Section>
        <ConstrainWidth center>
          <SectionTitle>Thank you!</SectionTitle>
          <Typography variant="h5">
            We'll be in touch as soon as we open the beta access period.
          </Typography>
          <Typography>
            We're still actively developing the course challenges and
            curriculum, but we expect to launch the beta within the next few
            months.
          </Typography>
          <Typography>
            In the meantime, feel free to try out the platform.
          </Typography>
          <ActionButton
            style={{ marginTop: 20 }}
            onClick={() => {
              window.open('https://app.pairwise.tech');
            }}
          >
            Try it out
          </ActionButton>
        </ConstrainWidth>
      </Section>
    </Layout>
  );
};

export default Thanks;
