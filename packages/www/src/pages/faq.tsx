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
It's free to learn how to program. The paid course is for learning to build apps
and/or get a job as a software engineer.

The free modules will teach you how to program and give you a foundation on
which you can build. 

> If you'd like to take the first section and then go off and learn the
rest on your own feel free! 

The creators of this course did much the same and it's certainly possible. The
remaining modules will teach you all you need to know to go from a basic
programming level to being able to get a job as a software engineer. You will
learn how to build applications, how to architect systems, how to break in to
the software industry, and many more things.
    `,
  },
  {
    question: `
    How much will the full course cost?
    `,
    answer: `
The course is currently in-progress and doesn't have a set price, however, you
can pre-purchase the course for $50 and lock in full-access.
    `,
  },
  {
    question: `
    Can anyone really learn to code?
    `,
    answer: `
Yes, but not everyone will. Coding is not for everyone, but you won't know
if it's for you or not until you try. By the end of the first few modules, which
are entirely free, you should have a good sense of what programming is
like and whether or not you want to continue.
    `,
  },
  {
    question: `
    What will I learn?
    `,
    answer: `
You will learn how to build full software. By the end of the course you will be
able to build applications like Twitter, Facebook, Airbnb, etc. In other words you will have all the skills you need to:

* Get a job
* Work for yourself
* Build a startup
    `,
  },
  {
    question: `
    Why TypeScript?
    `,
    answer: `
TypeScript is a superset of JavaScript which is the language that
powers the web. JavaScript is the most ubiquitous programming language in the
world, which means by learning it you will be able to read and understand a
tremendous amount of applications and code in the wild. Learning JavaScript is
akin to learning English in that way: Once you know it you have access to a vast
font of knowledge that was previously inaccessible.

### Why not JavaScript?

Given what we said above, JavaScript––rather than Typescript––might seem like
the obvious choice. In many ways it is, but TypeScript offers some specific
advantages:

* You learn types right away. In JavaScript you still have types, but it's not explicit.
* It can help learn. When TypeScript gives you an error it will often helpfully point to what's wrong rather than waiting until you run it to break.
* It's widely used in industry and therefore gives you a head start in the job market.

Furthermore, by learning TypeScript you've also learned JavaScript. So you'll be well-equipped to use either one.

### Why not Python?

Python is also an excellent choice for a first programming language, However
there are several reasons we believe it's less advantageous for your first
language.

* It doesn't run in a web browser. Even if you don't want to ultimately build web apps it's a great place to start learning because you get visual feedback.
* The differences between Python 2 and Python 3 can be confusing and cause unexpected bugs, especially when you're first starting.
* It's easy to pick up after learning JavaScript. Many JavaScript features were inspired directly by Python and much of what you learn in this course is universal to programming in general, not just JavaScript.
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
business. Either way, an investment of a few months now could put the rest
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
    Should I start this course or join a bootcamp?
    `,
    answer: `
You don't have to choose. We recommend you start with the first few modules of
this course to gain a foundation in programming. It's free and most bootcamps
will want to see that you've done some programming before admitting you.

Those first modules will give you a taste of programming and build up your
foundational knowledge, after which point you will know if you want to continue
down this path without spending $15,000 on a bootcamp.

Furthermore, if you decide to continue you can purchase the full Pairwise course
which will cover roughly the same curriculum as an immersive bootcamp ([see the
curriculum page](/curriculum/)).

What bootcamps really provide that Pairwise does not is in-person training. If
attending in-person classes is how you learn most effectively then a bootcamp
may be exactly right for you.
    `,
  },
  {
    question: `
    How is this different from a bootcamp?
    `,
    answer: `
A bootcamp is typically a multi-week fulltime, immersive program with
tuition usually greater than $10,000 USD. Many of these are great ways to learn code, but there are significant tradeoffs:

* High cost
* Extremely high time commitment
* Location dependent (you have to be there in person)

Not everyone has the money, the time, and lives in the right city to make a
bootcamp a viable option. Pairwise is an alternative to a bootcamp education
which anyone can use at their own pace from anywhere with an internet
connection.

Also, the programming fundamentals modules are completely free so we recommend
you go through those modules first. In our (completely unbiased) opinion
Pairwise is a great choice!

It can help you decide if a bootcamp is right for you, or it can allow you to
completely skip the need to attend a bootcamp.
    `,
  },
  {
    question: `
    How is this different from other online resources and tutorials?
    `,
    answer: `
As you might know, there are many great resources online for learning to
code. Many of these are cheap or even free. However, we observe a few
problems with these resources. First, there are too many of them. Second,
many of the deliver content passively in the form of videos, guides, or
tutorials, but with less hands-on activity.

For the new learner, these are big problems because to really learn software
development skills you have to do a TON of coding. In addition, the new learner
really doesn't know if they should learn JavaScript, or TypeScript, or
Python, or Golang, or C++, or Java, or if they should focus on fullstack web
development or mobile development or data science or machine learning/AI,
etc. etc. etc. The risk of burnout fatigue is very high for anyone trying to
teach themselves to code using online resources.

The curriculum here is a highly opinionated series of instruction with many
hands-on activities and projects. Thus, it solves the problems above by
providing a clear sequence of topics to learn and by teaching through practice,
which will give students the hundreds or thousands of hours of coding practice
they need to land a new job.
    `,
  },
  {
    question: `
    Is the content up to date? How will you make sure the content stays up to date?`,
    answer: `
We chose the Pairwise curriculum very carefully based on our analysis of current
software trends. We will continue to watch the market closely and we will update our
curriculum whenever we think there is a reason to do so. This includes changing the
technologies we teach, or simply updating challenges to stay consistent with the
current latest versions of the languages, libraries, and technologies we teach. We
take this very seriously and consider keeping our courses up to date one of our
main responsibilities to ensure a great product for our users.
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
              <QuestionAnswer>
                <Markdown source={answer.trim()} />
              </QuestionAnswer>
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
