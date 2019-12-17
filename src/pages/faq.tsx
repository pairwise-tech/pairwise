import React from 'react';
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

interface FaqItem {
  question: string;
  answer: string;
}

const QUESTIONS: FaqItem[] = [
  {
    question: `
    Is this free?
    `,
    answer: `
    The first module is free. This module will teach you how to
    program and give you a foundation on which you can build. If you'd
    like to take the first section and then go off and learn the rest on your
    own feel free! The creators of this course did much the same and it's
    certainly possible. The remaining modules will teach you all you need to
    know to go from a basic programming level to being able to get a job as
    a software engineer. You will learn how to build applications, how to
    architect systems, how to break in to the software industry, and many
    more things.`,
  },
  {
    question: `
    How much will the full course cost?
    `,
    answer: `
    We haven't decided yet. We're currently focused on building out
    a great course that will achieve our goals for our students. We believe in
    providing value first and deciding what to charge later, once we're sure
    that what we're selling is truly worth what we charge.
    `,
  },
  {
    question: `
    Why TypeScript?
    `,
    answer: `
    TypeScript is a typed, superset of JavaScript which is the language that
    powers the web. All modern website use JavaScript to deliver engaging web
    experiences. TypeScript is rapidly becoming the preferred way to develop
    JavaScript applications by professional developers and therefore the
    starting point for our curriculum.
    `,
  },
  {
    question: `
    How long will it take?
    `,
    answer: `
    The course is entirely self-paced, so it could take as long as you need.
    In practice, this course can usually be completed in 3-6 months depending
    on your hourly commitment each day. Does that sound like a lot? Consider
    that by completing this course you're putting yourself on a footing to
    enter an entirely new career, a career that you might remain in for the
    rest of your working life or simply a stepping stone to building your own
    business. Either way, an investment of a few months new could put the rest
    of your life on an entirely new trajectory.
    `,
  },
  {
    question: `
    Will I really be able to find a job after taking this course?
    `,
    answer: `
    Yes, but it will not fall into your lap. Completing this course will give
    you hirable skills, however, it is not a promise you will be hired. You
    will still have to navigate the challenging world of applications,
    recruiters, and interviews with real companies. This process is hard but
    the starting point is gaining the skills companies are hiring for. That
    is the focus of this curriculum. From there, we can recommend you to
    numerous high quality resources which can assist you in the process to
    actually secure your first job as a developer.
    `,
  },
  {
    question: `
    Why did you create this?
    `,
    answer: `
    We believe that most online coding education falls short and fails to
    deliver real results for students. We have also personally experienced
    the life-changing nature of learning to code, and want to make this more
    accessible to anyone in the world who is interested.
    `,
  },
  {
    question: `
    What will I learn?
    `,
    answer: `
    You will learn modern fullstack software development skills, specifically
    how to build web and mobile applications using TypeScript, React, and
    NodeJS. You will learn how to build, test, and deploy these applications,
    along with a variety of other topics. In addition, you will gain a solid
    foundation fundamental programming skills which will be useful in an
    software development career.
    `,
  },
  {
    question: `
    Can anyone really learn to code?
    `,
    answer: `
    Yes, but not everyone will. Coding is not for everyone, but you won't know
    if it's for you or not until you try. By the end of the first module, which
    is entirely free, you should have a good sense of what programming is
    like and whether nor not you want to continue.
    `,
  },
  {
    question: `
    Should I start this course or join a bootcamp?
    `,
    answer: `
    We cannot make this decision for you, however, if you have any hesitation
    about joining a bootcamp this course should be able to give you a strong
    signal to help you make that choice. Generally speaking, the content and
    skills we provide here are very similar to the skills you will receive
    from most immersive bootcamp experiences.
    `,
  },
  {
    question: `
    I am interested in studying computer science in college, or I already am
    doing this. Should I join this course as well?`,
    answer: `
    The course here will give you a healthy appreciation for practical
    computer programming and will be a strong complement to a CS degree or
    an effective way to quickly learn if a CS degree is the right choice
    for you.
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
      <SEO title="FAQ" description="Frequently Asked Questions" />
      <Section>
        <SectionTitle>Frequently Asked Questions</SectionTitle>
        {QUESTIONS.map(({ question, answer }) => {
          return (
            <LearningSection key={question.slice(0, 15)}>
              <CoolCodeBullet text="?" />
              <Typography variant="h5">{question}</Typography>
              <QuestionAnswer>{answer}</QuestionAnswer>
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

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default FAQ;
