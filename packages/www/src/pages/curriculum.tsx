import React from 'react';
import Markdown from 'react-markdown';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

import { Section, SectionTitle } from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { CoolCodeBullet, LearningSection } from '.';

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface ImageData {
  alt: string;
  source: string;
  caption: string;
}

interface FaqItem {
  question: string;
  answer: string;
  image?: ImageData;
}

const QUESTIONS: FaqItem[] = [
  {
    question: `
    How was the curriculum chosen?
    `,
    answer: `
We have combined our professional experiences as software engineers with many
observations of technology trends in the software industry to choose specific
languages and skills which are in high and increasing demand and also very
accessible from a learning perspective.

Our observations of industry trends largely come from several sources:

- [StateOfJS 2019](https://2019.stateofjs.com/)
- [HackerNews Hiring Trends data](https://www.hntrends.com/)
- [StackOverflow 2019 Developer Survey](https://insights.stackoverflow.com/survey/2019)

Feel free to look at these in detail and draw your own conclusions. We think our
choices represent the best combination of in-demand skills which are easily
learnable for someone with no prior coding experience.

Based on these observations, our curriculum teaches fullstack **TypeScript,
React, and NodeJS.**
    `,
  },
  {
    question: `
    TypeScript
    `,
    answer: `
You may not have heard of [TypeScript](https://www.typescriptlang.org/) before,
but you may have heard of JavaScript, the "language of the web". All websites
and web applications use JavaScript to deliver high quality, interactive
experiences and products.

TypeScript is a typed superset which compiles to JavaScript. Basically, what
this means is that TypeScript is essentially JavaScript but adds additional
features and capabilities to the language which are not present in vanilla
JavaScript.

There is a strong trend currently toward using TypeScript as the de facto
way to write JavaScript applications.
    `,
    image: {
      source: 'ts_vs_js',
      alt: 'TypeScript hiring trends',
      caption:
        'TypeScript vs. JavaScript hiring trends data, [source](https://www.hntrends.com/2019/aug-typescript-reaches-top-10.html).',
    },
  },
  {
    question: `
    React
    `,
    answer: `
[React](https://reactjs.org/) is a tool which allows developers to quickly and
  efficiently build complex interfaces and frontend applications. React was open
sourced by Facebook several years ago and has exploded in adoption, now becoming
the dominant framework for building user interfaces.

React is an excellent starting point for learning frontend development and will
  give you many job opportunities. The site you are looking at right now, for
    instance, is built with React.
    `,
    image: {
      source: 'react_js',
      alt: 'React hiring trends',
      caption:
        'React hiring trends data, [source](https://www.hntrends.com/2019/oct-no-sign-of-react-falling-back.html).',
    },
  },
  {
    question: `
    NodeJS
    `,
    answer: `
[NodeJS](https://nodejs.org/en/) is a runtime environment for JavaScript.
Traditionally, JavaScript only existed in the context of web browsers, so
JavaScript development was limited to developing websites and web applications.

However, NodeJS allowed developers to start building servers and other
applications using JavaScript as well. Since the advent of NodeJS, the
JavaScript ecosystem has grown dramatically and you can use JavaScript to
develop web applications, servers, mobile applications, and even native
desktop applications.

And, of course drawing on our first trend, these applications will be
increasingly written in TypeScript.
    `,
    image: {
      source: 'node_js',
      alt: 'NodeJS Trends',
      caption:
        'NodeJS growing in popularity, [source](https://insights.stackoverflow.com/survey/2019).',
    },
  },
  {
    question: `
    Fullstack
    `,
    answer: `
Fullstack refers to developing applications across the entire stack: frontend
and backend. Frontend development refers to building user interfaces, the client
applications which people actually interact with. Backend development refers
to building servers and databases which support these UIs.

In the world of software development, it is becoming increasingly useful to
understand the "full stack" of application development, although many developers
do end up specializing in a specific area.

In terms of learning and getting your first job, it is especially advantageous
to have frontend and backend skills: this will make you more marketable to
employers and give you a better idea of which area you enjoy more which can
guide your job search and professional development.
    `,
    image: {
      source: 'full_stack',
      alt: 'NodeJS Trends',
      caption:
        'Fullstack developers are the most common job type, [source](https://insights.stackoverflow.com/survey/2019).',
    },
  },
  {
    question: `
    What else will I learn?
    `,
    answer: `
The core of the curriculum teaches Fullstack TypeScript development, specializing
in React and NodeJS. However, you will learn a variety of software engineering
skills which will prove useful throughout an entire career.

For instance, you will learn how software engineers develop software and work in
teams using tools like Git (version control). You will learn about common
development practices like sprints, agile workflow, kanban, scrum, etc.

You will learn a bit about developing mobile applications using React Native,
which will expand your skill-set and knowledge base.

You will learn how software applications are tested and deployed. You will
learn common testing practices and how CI/CD works, and the basics of common
cloud providers like AWS and GCP. These are all important professional skills
which most people only learn in the context of a job.

Finally, you will build up a portfolio of real world projects during this learning
process which will give you a strong showcase of your skills to present to future
employers!
    `,
  },
];

/** ===========================================================================
 * Component
 * ============================================================================
 */

const FAQ = () => {
  return (
    <Layout>
      <SEO title="Why" description="Why should I use this?" />
      <Section>
        <SectionTitle>Curriculum Rationale</SectionTitle>
        {QUESTIONS.map(({ question, answer, image }) => {
          return (
            <LearningSection key={question.slice(0, 15)}>
              <CoolCodeBullet text="•" />
              <Typography variant="h5">{question}</Typography>
              <QuestionAnswer>
                <Markdown source={answer.trim()} />
              </QuestionAnswer>
              {image && (
                <Img
                  alt={image.alt}
                  src={require(`../images/${image.source}.png`)}
                />
              )}
              {image && (
                <QuestionAnswer>
                  <Markdown source={image.caption.trim()} />
                </QuestionAnswer>
              )}
            </LearningSection>
          );
        })}
      </Section>
    </Layout>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const QuestionAnswer = styled.p`
  font-weight: 100;
`;

const Img = styled.img`
  max-width: 650px;

  @media (max-width: 550px) {
    max-width: 100%;
  }
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default FAQ;
