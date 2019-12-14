import React from 'react';

import { Section, SectionTitle } from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Markdown from 'react-markdown';

const FAQ = () => {
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
    <Layout>
      <SEO title="FAQ" description="Frequently Asked Questions" />
      <Section>
        <SectionTitle>Frequently Asked Questions</SectionTitle>
        <Markdown source={text} />
      </Section>
    </Layout>
  );
};

export default FAQ;
