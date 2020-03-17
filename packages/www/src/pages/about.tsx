import React from 'react';
import { Link } from 'gatsby';
import Markdown from 'react-markdown';
import styled from 'styled-components';

import { Section, SectionTitle } from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Typography from '@material-ui/core/Typography';
import { CoolCodeBullet, LearningSection } from '.';

const DESCRIPTION = `
We're a team of two, self-taught software engineers that formerly worked together in San Francisco. This is the story of Pairwise.
`.trim();

const THE_TEAM = `
We're both self-taught programmers who had different, but similar paths to becoming software engineers. We met in San Francisco as coworkers at a small startup.
`;

const THE_MISSION = `
* **Short term:** Prove our thesis that there really is a better way to teach and learn by building an online course in one of the world's most popular technology stacks. We'll prove out our teaching ability and fund our ongoing work by charging for the more advanced sections of the course.
* **Long term:** Transform technical education. We believe that at present the education systems of the world have barely scratched the surface of what's become possible through technology.
`;

const CONTACT = `
We know we should really say more here, and we will! There's just
more important things we need to prioritize while we build out the
course. If you have any questions at all don't hesitate to get in
touch.
`;

const About = () => {
  return (
    <Layout>
      <SEO title="About Pairwise" description={DESCRIPTION} />
      <HeadlineImage>
        <img
          src={require('../images/the-cake-is-real.jpg')}
          alt="Pairwise Launch Cake!"
        />
      </HeadlineImage>
      <PostImageSection>
        <SectionTitle>Hey there, we're Pairwise</SectionTitle>
        <p>
          We're two friends and former coworkers who believe deeply in improving
          education.
        </p>
        <p style={{ marginBottom: 40 }}>
          That's us on the cake. One of our friends surprised us, what a gift!
        </p>
        <LearningSection>
          <CoolCodeBullet text="👋" />
          <Typography variant="h5">The Team</Typography>
          <Markdown source={THE_TEAM} />
        </LearningSection>
        <LearningSection>
          <CoolCodeBullet text="🤔" />
          <Typography variant="h5">The Mission</Typography>
          <Markdown source={THE_MISSION} />
        </LearningSection>
        <LearningSection>
          <CoolCodeBullet text="?" />
          <Typography variant="h5">Why is your about page so short?</Typography>
          <Markdown source={CONTACT} />
          <Link to="/contact">Get in touch</Link>
        </LearningSection>
      </PostImageSection>
    </Layout>
  );
};

const HeadlineImage = styled.div`
  display: block;
  overflow: hidden;
  border-radius: 50px 50px 0 0;
  margin: 0 auto;
  margin-top: 80px;
  box-shadow: 0 -10px 20px 0px rgba(0, 0, 0, 0.4);
  max-width: 800px;

  img {
    display: block;
    max-width: 100%;
    margin: 0 auto;
  }
`;

const PostImageSection = styled(Section)`
  box-shadow: 0 -10px 20px 2px rgba(0, 0, 0, 0.45);
  border-top: 1px dashed rgba(140, 140, 140, 0.45);
`;

export default About;
