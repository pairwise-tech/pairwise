import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Markdown from 'react-markdown';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Section from '../components/Section';

const MainContainer = styled(Section)`
  margin-top: 0px;
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

const Left = styled.div`
  flex: 1 100%;
`;

const Right = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  width: 100%;
  position: relative;
  margin-top: 40px;

  @media (min-width: 768px) {
    width: 40%;
    margin-top: 0px;
  }
`;

const MainImg = styled.img`
  width: auto;
  max-width: 100%;
  margin: 0 auto;
  display: block;

  @media (min-width: 550px) {
    max-width: 80%;
  }

  @media (min-width: 768px) {
    position: absolute;
    top: 0;
    left: 0;
    width: 800px;
    max-width: unset;
    z-index: 9;
  }
`;

const MainDiv = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const Main = () => {
  return (
    <MainDiv>
      <Left>
        <Typography style={{ marginBottom: 40 }} variant="h3">
          Learn to code with hands-on, immersive, project-based instruction.
        </Typography>
        <Typography style={{ marginBottom: 40 }} variant="h5">
          Want to learn to code? Start learning in seconds—it's free.
        </Typography>
        <ActionButton href="https://prototype-x.netlify.com">
          Get Started
        </ActionButton>
      </Left>
      <Right>
        <MainImg
          src={require('../images/code-image.png')}
          alt="Image of CODE -- HTML"
        />
      </Right>
    </MainDiv>
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

const MiniFAQ = () => {
  const text = `
- Why should I learn to code?
    - There are many reasons, but here are a few:
        - Economic opportunity. Software Engineering is ...
            - Among highest paid careers
            - One of the fastest growing job sectors
            - Upward mobility in both engineering and management
        - Build a startup/business: Is there anything you wish existed that doesn't? If you  knew how to program you might be able to build it yourself.
        - Flexibility: You can program from anywhere in the world as long as you have a computer and an internet connection. You can also choose when to work and when to play. Furthermore, you can choose full-time employment or part-time, working only for clients you trust and enjoy working with. If you value being able to choose when you work, where you work, and who you work with then learning to code might be for you.
        - Solve your own problems: Being able to code opens up new ways you can solve your own problems.
            - Trying to find a home in a hot area of the city? Write a program to detect when a new listing goes up and automatically send a message to the owner/renter.
            - Trying to register for a course that's constantly filling up? Write a program to register for you, within seconds of a spot opening up.
            - Want your coffee maker to automatically start a brew at 7:23 every morning so that there's coffee ready as soon as you roll out of bed? Write a program to do that.
- Who is this course for?
    - In short, anyone who doesn't know how to code but is at least a little bit curious about it.
    - Someone who wants to start their first career as a software developer.
    - Someone who wants to start a new career as a software developer.
    - Someone who wants to gain practical engineering skills to build a startup.
    - Someone who has tried to learn to code but never made substantial progress, drifting from one online tutorial to the next.
    - Someone who is interested in programming, but not sure if it is the right choice for them as a career.
    - Someone who knows they want to learn to code, but is unsure what topics, languages, frameworks, etc. to focus on.
    - Someone who wants to attend a coding bootcamp but for some reason can find the time or money to do so, or doesn't have access to one where they live.
    - Someone who is trying to learn to code but has a busy life already and can only devote a few hours at a time to their learning process.
    - Someone who is happy with their current profession but is concerned about future job security as software and automation continue to disrupt many traditional industries and careers.
    - Someone who already works with software engineers in some capacity and wants to understand their profession in more depth, e.g. recruiters, product managers, project managers, designers, etc.
- Who is it not for?
    - People who already know what they are doing? I.e. you're already a software engineer
    - People already in a bootcamp (might be redundant)
    - People who are currently in the process of trying to be hired as a developer, i.e. you already have basic programming skills and a portfolio of projects and are currently applying and interviewing at companies.
    - For any reason, you are more interested in learning to program starting with some other language, e.g. Python, Go, Java, etc.
    - Data scientists, less SE focused roles, PMs, dev ops.. etc?
    - You're interested in hardware, gaming, VR, low level, etc...
    - You have no interest in learning to code
    - You don't have access to a computer...
  `.trim();

  return (
    <div>
      <Typography style={{ marginBottom: 40 }} variant="h3">
        FAQ
      </Typography>
      <Markdown source={text} />
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
      <Section alternate>
        <MiniFAQ />
      </Section>
    </Layout>
  );
};

export default IndexPage;
