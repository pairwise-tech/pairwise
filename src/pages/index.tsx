import Card from '@material-ui/core/Card';
import { Link } from 'gatsby';
import CardContent from '@material-ui/core/CardContent';
import Markdown from 'react-markdown';
import Paper from '@material-ui/core/Paper';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

import { Section, SectionTitle, ActionButton } from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const EMAIL_SIGNUP_SECTION_ID = 'email-signup-section';

const AboveFoldSection = styled(Section)`
  margin-top: 0px;
`;

const MainBackground = styled.div`
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

const Left = styled.div`
  z-index: 1;
  position: relative;
  flex: 1 100%;

  @media (min-width: 768px) {
    margin-right: 10px;
  }
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
        <ActionButton
          onClick={() => {
            /**
             * Until the platform is released scroll to the email signup
             * section.
             */
            const element = document.getElementById(EMAIL_SIGNUP_SECTION_ID);
            element.scrollIntoView({ behavior: 'smooth' });

            /* Later link to the actual platform: */
            // window.open('https://prototype-x.netlify.com', '_blank');
          }}
        >
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
- Type coercion
- IDE-like environment
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
      title: 'Developer Workflow (beginning of paid course content)',
      description: `
Learn about the tools developers use on a daily basis to get work done. Become familiar with common workflows and practices and how teams coordinate development on complex software projects.

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
      title: 'Async Programming & APIs',
      description: `
Learn how to accomplish larger tasks with code and how to tell your code to interact with other programs. Learn about how your phone or laptop can communicate with a server.

This section will serve as the foundation for how your UI (app) will communicate with your server, or how any program you write can communicate with other programs. This type of communication typically uses an API (Application Programming Interface). Here we will learn what APIs are and how to use them.
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
      title: 'Capstone Project',
      description: `
The final stretch. At this point we'll walk you through some real world projects after you implement them yourself.

These are real-world projects that you can deploy and use. You will be able to point to these projects during interviews to show that you really know what you're talking about. Best of all, you really will know what you're talking about.
      `,
      topicList: '',
    },
    {
      title: 'Career & Interview Section',
      description: `
The final stretch. At this point we'll walk you through some real world projects after you implement them yourself.

These are real-world projects that you can deploy and use. You will be able to point to these projects during interviews to show that you really know what you're talking about. Best of all, you really will know what you're talking about.
      `,
      topicList: '',
    },
  ];

  return (
    <div>
      <SectionTitle>What You Will Learn</SectionTitle>
      {sections.map((x: Section, i: number) => {
        const sectionNum = i + 1;
        return (
          <LearningSection key={x.title}>
            <CoolCodeBullet text={String(sectionNum)} />
            <div>
              <Typography variant="h5">{x.title}</Typography>
            </div>
            <div>
              {x.description && <Markdown source={x.description.trim()} />}
            </div>
          </LearningSection>
        );
      })}
    </div>
  );
};

export const CoolCodeBullet = ({ text }: { text: string }) => (
  <div className="num">
    <span>{'{'}</span>
    <p>{text}</p>
    <span>{'}'}</span>
  </div>
);

export const LearningSection = styled.div`
  position: relative;
  padding-top: 40px;
  margin-bottom: 60px;
  max-width: 700px;

  a {
    color: #00ffb9;
  }

  .num {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-family: monospace;

    span {
      display: block;
      font-weight: 100;
      font-family: 'Helvetica Neue', monospace;
    }

    p {
      color: #f50057;
      font-size: 30px;
      margin: 0;
      width: 40px;
      text-align: center;
    }
  }

  @media (min-width: 768px) {
    padding-top: 0;
    padding-left: 80px;

    .num {
      top: 0;
      left: 0;
      transform: translate(0, 0);
    }
  }
`;

const WhyLearnThisCourse = () => {
  const sections: Section[] = [
    {
      title: 'Launch Your Career',
      description: `
Learning how to program and build software applications is a crucial 21st
century skill which will give you fantastic professional and career
opportunities over the coming decades. The US Bureau of Labor Statistics for
instance forecasts software developers as enjoying 26% job growth through 2018
with a [median salary of over $100,000](https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm#tab-6(https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm#tab-6)).

Furthermore, programming can put you in an excellent position to manage other
programmers, if switching to a career in management is our cup of tea, or work
in other areas of tech, such as product development, design, data science,
etc. In short, learning to code is a fundamental skill required for a
wide variety of 21st careers.`,
    },
    {
      title: 'Build a Startup',
      description: `
Many of the large companies which have changed our world in the last 25 years
began as small startups driven by software development. And we have seen
these companies grow massively and completely change our world - for instance,
[Apple is now worth more than the entire US energy sector](https://www.businessinsider.sg/apple-market-cap-higher-than-us-energy-sector-baml-analysts-2019-11/?r=US&IR=T).

With coding skills in your pocket you can start a business and solve problems
for yourself and others. You don't even need startup funding because you can
build the initial product yourself, and if you want to raise money you will
have a much better chance if you already have a prototype you can shop around.
      `,
    },
    {
      title: 'Achieve Freedom & Flexibility',
      description: `
Work from anywhere, or an office. Whether you prefer working from a desk, a
beach or your own bed you can work from anywhere as long as you have a computer
and internet. Work 40 hours a week, 80, or 10. The jobs available for software professionals
are so varied that you can find a work schedule to fit any lifestyle.

Moreover, software pervades all sectors of the modern economy. Whether you are
passionate about gaming, travel, education, non-profits, healthcare, renewable
energy, or space travel, you can find a software career which will let you
solve the problems you care about the most.
      `,
    },
  ];
  return (
    <div>
      <SectionTitle>Why learn to code?</SectionTitle>
      <Typography style={{ marginBottom: 20 }} variant="h5">
        Programming is not for everyone, but here are a few reasons why you
        might want to give it a try.
      </Typography>
      <div>
        <div className="sections">
          {sections.map((x: Section) => {
            return (
              <DarkPaper key={x.title}>
                <Typography style={{ marginBottom: 20 }} variant="h4">
                  {x.title}
                </Typography>
                {x.description && <Markdown source={x.description.trim()} />}
              </DarkPaper>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DarkPaper = styled(Paper)`
  padding: 10px;
  padding-top: 20px;
  margin-bottom: 20px;
  border-bottom: 5px solid #02ffb9;
  box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
    0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12),
    0 4px 4px -3px #23ff2c;

  a {
    color: #00ffb9;
  }

  @media (min-width: 768px) {
    padding: 20px;
  }
`;

const WhoIsThisFor = () => {
  return (
    <div>
      <SectionTitle>Who is this for?</SectionTitle>
      <Typography style={{ marginBottom: 20 }} variant="h5">
        In short, anyone who doesn't know how to code but is at least a little
        bit curious about it.
      </Typography>
      <ColRow>
        <ColRowCard style={{ borderTop: '5px solid #00ffb9' }}>
          <CardContent>
            <Typography style={{ marginBottom: 20 }} variant="h4">
              This course <HL color="rgba(0, 255, 149, 0.49)">is</HL> for you
              if...
            </Typography>
            <Typography style={{ marginBottom: 20 }}>
              You have any interest in learning to code (regardless of prior
              experience) or specifically if you want to learn how to program
              and begin a career as a software developer.
            </Typography>
          </CardContent>
          <Pre>\\\(۶•̀ᴗ•́)۶//／／</Pre>
        </ColRowCard>
        <ColRowCard style={{ borderTop: '5px solid rgba(255, 255, 0, 0.53)' }}>
          <CardContent>
            <Typography style={{ marginBottom: 20 }} variant="h4">
              This course <HL>is not</HL> for you if...
            </Typography>
            <Typography style={{ marginBottom: 20 }}>
              You're already a professional software engineer. You might learn
              almost nothing or you might learn a lot form this course, but at
              least some of it will be redundant.
            </Typography>
          </CardContent>
          <Pre>(╯°□°）╯︵ ┻━┻</Pre>
        </ColRowCard>
      </ColRow>
      <SectionTitle style={{ marginTop: 32 }}>More questions?</SectionTitle>
      <Typography style={{ marginTop: 40, marginBottom: 20 }} variant="h5">
        Take a look at our <FaqLink to="/faq">FAQ</FaqLink>.
      </Typography>
    </div>
  );
};

const FaqLink = styled(Link)`
  color: #f50057;
`;

const HL = styled.span`
  display: inline-block;
  position: relative;
  z-index: 2;
  &:after {
    z-index: 1;
    position: absolute;
    display: block;
    content: '';
    background: ${({ color = 'rgba(255, 255, 0, 0.42)' }: { color?: string }) =>
      color};
    left: -3px;
    right: -3px;
    height: 10px;
    top: 70%;
  }
`;

const Pre = styled.pre`
  padding: 20px;
  text-align: center;
  margin: 0;
`;

const ColRowCard = styled(Card)`
  margin-bottom: 20px;
  background-color: white !important;
  color: #2d2d2d !important;
  @media (min-width: 768px) {
    width: 48%;
  }
`;

const ColRow = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const GetEarlyAccess = () => {
  const [email, setEmail] = useState<string>('');
  const handleChange = (e: any) => {
    setEmail(e.target.value);
  };

  return (
    <div id={EMAIL_SIGNUP_SECTION_ID}>
      <SectionTitle>Get Early Access</SectionTitle>
      <Typography style={{ marginBottom: 20 }}>
        Enter your email below to be selected as an exclusive first user of our
        platform as we launch the initial lesson modules.
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
      <AboveFoldSection>
        <MainBackground />
        <Main />
      </AboveFoldSection>
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
