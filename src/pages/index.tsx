import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Grid from '@material-ui/core/Grid';
import Markdown from 'react-markdown';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

import Layout from '../components/Layout';
import SEO from '../components/SEO';

const Section = styled(Container)`
  padding-top: 80px;
  padding-bottom: 80px;
  background-color: ${(props: { alternate?: boolean }) =>
    props.alternate ? '#2d2d2d' : '#1d1d1d'};
`;

const MainContainer = styled(Section)`
  margin-top: 40px;
`;

const ActionButton = styled(Button)`
  background: linear-gradient(45deg, #fe6b8b 30%, #ff8e53 90%);
  border-radius: 3px;
  border: 0;
  color: white;
  height: 48px;
  padding-left: 30px !important;
  padding-right: 30px !important;
  box-shadow: '0 3px 5px 2px rgba(255, 105, 135, .3)';
`;

const Main = () => {
  return (
    <div>
      <Typography style={{ marginBottom: 40 }} variant="h3">
        Learn to code with hands-on, immersive, project-based instruction.
      </Typography>
      <Typography style={{ marginBottom: 40 }} variant="h5">
        Want to learn to code? Start learning in seconds—it's free.
      </Typography>
      <ActionButton href="https://prototype-x.netlify.com">
        Get Started
      </ActionButton>
    </div>
  );
};

interface Section {
  title: string;
  description?: string;
}

const WhatWillYouLearn = () => {
  const sections: Section[] = [
    {
      title: 'Programming Fundamentals (100% FREE to everyone)',
      description: `
After this section you will be able to program. You won't be writing complex
apps yet but you'll be familiar with everything listed below.

- HTML/CSS + Markup
- Types and type primitives
- Type coercion
- Equivalence
- Type coercionIDE-like environment
- Language semantics: syntax, keywords, etc.
- Code & program execution
- Language runtime: memory heap, execution flow, etc.
- Variable declarations
- Conditional & control statements
- Looping & breaking
- Printing values & debugging
- Data structure/collections
- Functions
- Built-in language methods
- Classes
- Modules
- Libraries/dependencies
- Scopes
- Closures
- Error handling
- Programming Styles: imperative/object-oriented/functional
- Mutation/Immutability
- Globals
      `,
    },
    {
      title: 'Developer Workflow',

      description: `
Learn about the tools developers use on a daily basis to get work done. Become
familiar with common workflows and practices.

- Terminal
- Git/Github/Repos
- HTML/CSS
- Building a portfolio to showcase projects and skills
- Static site deployment
      `,
    },
    {
      title: 'Async Programming',
      description: `
This section will teach you how computers interact with each other, and how you
can build full-scale apps by connecting a users computer (a phone for example)
to a server.

- Promises/Promise.all
- async/await
- fetch API/axios
- HTTP/REST APIs
      `,
    },
    {
      title: 'UI Programming',
      description: `
Now we start diving deep into what building an app for a user looks like. Learn
how to build the interface that users interact with.

- React/JSX
- Hooks
- CSS-in-JS
- Flexbox
- Redux
- Single page applications
      `,
    },
    {
      title: 'Server Programming',
      description: `
In this section learn about servers, what they are used for and how to create one. Hint: Servers are just computers that run a certain type of software.

- NodeJS
- Express
- Persistent Data
      `,
    },
    {
      title: 'Databases',
      description: `
This section builds on the last, going deep into how large amounts of data are stored and retreived using databases.

- PostgreSQL
- MongoDB
- Redis
- Firebase
      `,
    },
    {
      title: 'Mobile',
      description: `
In this section we introduce programming a new type of computer: Phones.

- Progressive Web Apps
- React Native
- Expo
      `,
    },
    {
      title: 'Testing & Automation',
      description: `
Learn about how you can automate tasks, including testing your own apps to make
sure they don't break when you add new features or update them.

- Testing pyramid
- Jest
- Cypress
      `,
    },
    {
      title: 'Debugging & Refactoring',
      description: `
Here we dive deeper into two vital skills for all programmers: Debugging and refactoring.
      `,
    },
    {
      title: 'Delivery & Deployment',
      description: `
This is how your apps get online and stay online, even as you're updating the
code and even when you unintentionally break something by introducing new bugs.

- CI/CD
- Devops
- CircleCI/GitHub Actions
- AWS/GCP/Azure
      `,
    },
    {
      title: 'Capstone Projects',
      description: `
The final stretch. At this point we'll walk you through some real world projects after you implement them yourself.
    `,
    },
    {
      title: 'Career & Interview Section',
      description: `
Now that you have the technical skills, it's time to put them to use and get a job as a software engineer! We'll walk you through the process and what to expect, from interviews to salary offers.
      `,
    },
  ];

  return (
    <div>
      <Typography style={{ marginBottom: 40 }} variant="h3">
        What You Will Learn
      </Typography>
      {sections.map((x: Section) => {
        return (
          <ExpansionPanel key={x.title}>
            <ExpansionPanelSummary
              expandIcon={<ExpandMore />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>{x.title}</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{ display: 'block' }}>
              {x.description && <Markdown source={x.description.trim()} />}
            </ExpansionPanelDetails>
          </ExpansionPanel>
        );
      })}
    </div>
  );
};

const GetEarlyAccess = () => {
  const [email, setEmail] = useState<string>('');
  const handleChange = (e: any) => {
    setEmail(e.target.value);
  };

  return (
    <div>
      <Typography style={{ marginBottom: 40 }} variant="h3">
        Get Early Access
      </Typography>
      <Typography style={{ marginBottom: 20 }}>
        Enter your email and we'll let you know when more modules are released.
        You can also sign up to be a beta tester to get access even sooner.
      </Typography>
      <form action="">
        <TextField
          style={{ marginBottom: 20 }}
          fullWidth
          id="email"
          label="Email"
          variant="outlined"
          value={email}
          onChange={handleChange}
        />
        <ActionButton type="submit">I want!</ActionButton>
      </form>
    </div>
  );
};

const IndexPage = () => {
  return (
    <Layout hideHeader>
      <SEO
        title="Learn to code"
        description="Learn to code with hands-on, immersive, project-based instruction."
      />
      <MainContainer>
        <Main />
      </MainContainer>
      <Section alternate>
        <WhatWillYouLearn />
      </Section>
      <Section>
        <GetEarlyAccess />
      </Section>
    </Layout>
  );
};

export default IndexPage;
