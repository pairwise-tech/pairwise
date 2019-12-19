import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import {
  ActionButton,
  ConstrainWidth,
  Section,
  SectionTitle,
} from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const FAQ = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  return (
    <Layout>
      <SEO title="Contact" description="Get in touch with us" />
      <Section>
        <ConstrainWidth>
          <SectionTitle>Contact</SectionTitle>
          <Typography variant="h5" style={{ marginBottom: 20 }}>
            Want to get in touch? We'd love to hear from you!
          </Typography>
          <form action="">
            <TextField
              style={{ marginBottom: 20 }}
              fullWidth
              id="email"
              label="Email"
              variant="outlined"
              helperText="Where can we get in touch with you?"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              multiline
              style={{ marginBottom: 20 }}
              inputProps={{ style: { minHeight: 100 } }}
              fullWidth
              id="message"
              label="Message"
              variant="outlined"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </form>
          <ActionButton type="submit">Send</ActionButton>
        </ConstrainWidth>
      </Section>
    </Layout>
  );
};

export default FAQ;
