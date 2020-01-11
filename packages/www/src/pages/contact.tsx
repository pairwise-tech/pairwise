import { navigate } from 'gatsby';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import {
  ConstrainWidth,
  RemoteForm,
  Section,
  SectionTitle,
} from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const FAQ = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const validate = () => email && message;
  const handleComplete = () => {
    setIsComplete(true);

    // This sends us to this page but will show a notify message
    window.location.replace(
      `/contact?notify=${encodeURIComponent(
        `Thanks ${email}! We'll be in touch.`,
      )}`,
    );
  };

  return (
    <Layout>
      <SEO title="Contact" description="Get in touch with us" />
      <Section>
        <ConstrainWidth>
          <SectionTitle>Contact</SectionTitle>
          <Typography variant="h5" style={{ marginBottom: 20 }}>
            Want to get in touch? We'd love to hear from you!
          </Typography>
          <RemoteForm
            name="contact-us"
            onComplete={handleComplete}
            submitText="Send"
            validate={validate}
            errorText="Please fill out all fields."
          >
            <TextField
              style={{ marginBottom: 20 }}
              inputProps={{ style: { background: '#1d1d1d', borderRadius: 4 } }}
              fullWidth
              id="email"
              label="Email"
              variant="outlined"
              helperText="Where can we get in touch with you?"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isComplete}
            />
            <TextField
              multiline
              style={{
                marginBottom: 20,
                background: '#1d1d1d',
              }}
              inputProps={{
                style: {
                  minHeight: 100,
                },
              }}
              fullWidth
              id="message"
              label="Message"
              variant="outlined"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isComplete}
            />
          </RemoteForm>
        </ConstrainWidth>
      </Section>
    </Layout>
  );
};

export default FAQ;
