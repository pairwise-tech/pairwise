import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Markdown from 'react-markdown';
import React, { useState, ReactNode } from 'react';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

import { Section, SectionTitle, ActionButton } from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const MainContainer = styled(Section)`
  position: relative;
  background-color: rgba(0, 0, 0, 0.4);
  margin-top: 0px;
`;

const MainBackground = styled.div`
  z-index: 1;
  background-image: url(${require('../images/cmatrix.jpg')});
  position: absolute;
  opacity: 0.1;
  top: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  bottom: 0;
`;

const Left = styled.div`
  z-index: 1;
  position: relative;
  flex: 1 100%;
`;

const Right = styled.div`
  z-index: 1;
  position: relative;
  flex-grow: 0;
  flex-shrink: 0;
  width: 100%;
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
        <SectionTitle>
          Learn to code with hands-on, immersive, project-based instruction.
        </SectionTitle>
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
  topicList?: string;
}

const WhatWillYouLearn = () => {
  const sections: Section[] = [
    {
      title: 'Programming Fundamentals (100% FREE to everyone)',
      description: `
After this section you will be able to program. You won't be writing complex apps yet but you'll be familiar with everything listed below.

Specifically, you will learn the language TypeScript (a typed version of JavaScript) and basic programming concepts such as data structures and algorithms. This foundational knowledge will be directly transferrable to learning any other programming language in the future.
      `,
      topicList: `
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
Learn about the tools developers use on a daily basis to get work done. Become familiar with common workflows and practices.

You will learn how to use tools developers use to build software, such as VS Code, terminal, and GitHub, and you will learn how to deploy simple websites to the internet. You will use these skills to develop and deploy all of the course projects, which will give you a portfolio of projects to showcase your work to future employers.
      `,
      topicList: `
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
Learn how to accomplish larger tasks with code and how to tell your code to interact with other programs. Learn about how your phone or laptop can communicate with a server.

This section will serve as the foundation for how your UI (app) will communicate with your server, or how any program you write can communicate with other programs.
      `,
      topicList: `
- Promises/Promise.all
- async/await
- fetch API/axios
- HTTP/REST APIs
      `,
    },
    {
      title: 'UI Programming',
      description: `
Now we start diving deep into what building an app for a user looks like. Learn how to build the interface that users interact with.

You will learn ReactJS, a popular tool for building user interfaces, and other frontend skills such as Redux, React Hooks, CSS-in-JS, and Flexbox. This section will give you the skills to build complex single-page web applications (SPAs).
      `,
      topicList: `
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

You will learn NodeJS and Express, popular frameworks for building server applications, and you will learn how to design APIs which support basic CRUD (Create, Read, Update, Delete) functionality.
      `,
      topicList: `
- NodeJS
- Express
- Persistent Data
      `,
    },
    {
      title: 'Databases',
      description: `
This section builds on the last, going deep into how large amounts of data are stored and retrieved using databases.

You will learn about the two most common types of databases, relational (using PostgreSQL) and non-relational (using MongoDB).
      `,
      topicList: `
- PostgreSQL
- MongoDB
- Redis
- Firebase
      `,
    },
    {
      title: 'Mobile',
      description: `
In this section we introduce programming a new type of computer: Mobile phones.

You will learn building cross platform native mobile apps using React Native and other tools for building mobile web experiences.
      `,
      topicList: `
- Progressive Web Apps
- React Native
- Expo
      `,
    },
    {
      title: 'Testing & Automation',
      description: `
Learn about how you can automate tasks, including testing your own apps to make sure they don't break when you add new features.

You will learn how to use unit, integration, and end-to-end testing to ensure changes to your software do not introduce new bugs and you will learn how to use libraries such as Jest and Cypress to do this. You will also learn how to use programming to build simple tools to automate tasks and improve your life.
      `,
      topicList: `
- Testing pyramid
- Jest
- Cypress
      `,
    },
    {
      title: 'Debugging & Refactoring',
      description: `
Here we dive deeper into two vital skills for all programmers: Debugging and refactoring.

You will learn how to find precisely where in a program the code is breaking and how to rework the code (refactor) so that the bug is unlikely to reappear in the future.
      `,
      topicList: `
Here we dive deeper into two vital skills for all programmers: Debugging and refactoring.
      `,
    },
    {
      title: 'Delivery & Deployment',
      description: `
When you write software you will be doing it on your computer, but eventually you will want to launch that software so a wider audience can use it. This is called "deployment" and this section covers it in detail.

You will learn about common cloud service providers like AWS (Amazon Web Services) and GCP (Google Cloud Platform) and how to build CI/CD (continuous integration and deployment) pipelines to automate your software deployments.
      `,
      topicList: `
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

These are real-world projects that you can deploy and use. You will be able to point to these projects during interviews to show that you really know what you're talking about. Best of all, you really will know what you're talking about.
      `,
      topicList: `
The final stretch. At this point we'll walk you through some real world projects after you implement them yourself.
    `,
    },
    {
      title: 'Career & Interview Section',
      description: `
The final stretch. At this point we'll walk you through some real world projects after you implement them yourself.

These are real-world projects that you can deploy and use. You will be able to point to these projects during interviews to show that you really know what you're talking about. Best of all, you really will know what you're talking about.
      `,
      topicList: ``,
    },
  ];

  return (
    <div>
      <SectionTitle>What You Will Learn</SectionTitle>
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

const WhyLearnThisCourse = () => {
  return (
    <div>
      <SectionTitle>Why learn to code?</SectionTitle>
      <Typography style={{ marginBottom: 20 }} variant="h5">
        Programming is not for everyone, but here are a few reasons why you
        might want to give it a try.
      </Typography>
      <div>
        <Typography style={{ marginBottom: 20 }} variant="h4">
          Career Opportunity
        </Typography>
      </div>
    </div>
  );
};

const WhoIsThisFor = () => {
  return (
    <div>
      <SectionTitle>Who is this for?</SectionTitle>
      <Typography style={{ marginBottom: 20 }} variant="h5">
        In short, anyone who doesn't know how to code but is at least a little
        bit curious about it.
      </Typography>
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
      <SectionTitle>Get Early Access</SectionTitle>
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
        <MainBackground />
        <Main />
      </MainContainer>
      <Section alternate>
        <WhatWillYouLearn />
      </Section>
      <Section>
        <WhyLearnThisCourse />
      </Section>
      <Section alternate>
        <WhoIsThisFor />
      </Section>
      <Section>
        <GetEarlyAccess />
      </Section>
    </Layout>
  );
};

export default IndexPage;
