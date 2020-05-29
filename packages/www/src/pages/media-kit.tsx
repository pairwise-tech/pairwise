import React from 'react';
import Markdown from 'react-markdown';

import {
  Section,
  SectionTitle,
  ConstrainWidth,
} from '../components/components';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Typography from '@material-ui/core/Typography';

const THE_IDEA = `
### Learning to code is hard but it doesn't have to be

Learning to code is hard, but not only because of the nature of the
material. It's also hard because of the sheer volume there is to know and the
infinite paths you could take to climb the technical mountain.

Sean had an idea to change that—build an online course that is extremely
opinionated and approachable. He brought up the idea with Ian and they decided
to work together to build a new product.

### Opinionated Curriculum

What does an opinionated curriculum look like? It's **linear**. Most online
learning resources suffer from one of the following shortcomings. Other
resources aren't bad, they're just not ideal for beginners:

- Too niche. For instance, Courses on a specific framework or library. These
  resources are good for existing developers but not useful for beginners.
- Too broad. This type of course _has_ all the relevant material, but it reads
  like a choose-your-own-adventure book—Many paths, any of which could lead you
  to become a developer.

Linearity is key. We'll tell you where to start, where to go next and where to
go after that. We don't force students to do things in order, but we give them
an order that they can follow if they're unsure how to proceed.
`;

const MediaKit = () => (
  <Layout>
    <SEO
      title="Media Kit"
      description="Resources for media outlets interested in our story."
    />
    <Section>
      <ConstrainWidth>
        <SectionTitle>Media Kit</SectionTitle>
        <Markdown
          source={`
Here you'll find info about:

- The idea
- The founders
- The future
        `}
        />
        <Typography variant="h4">The Idea</Typography>
        <Markdown source={THE_IDEA} />

        <Typography variant="h4">The Founders</Typography>
        <Markdown
          source={`
Ian an Sean are both self-taught software engineers. They have no technical
degrees and didn't attend any coding bootcamps. As such, they're very familiar
with teaching yourself to code. To be specific, they know that it's both possible *and*
difficult. 

Late in 2019 the two set out to build a prototype. Initially the project was
called "Prototype X" and it was about as rough a rough draft can get and still
work. The prototype went up surprisingly quickly. In just a few weeks the first
usable version of what would later become Pairwise was born. Ian and Sean had
something to could show to users. For a few weeks they did just that.

However, as first-time founders they quickly got *really* excited about the
product. They stopped meeting with users in order to focus fully on building
content for the first course: Introduction to Programming.
        `}
        />

        <Typography variant="h4">The Future</Typography>
        <Markdown
          source={`
It's really exciting to have the first sections of the course done. Pairwise
haws hundreds of challenges and video explanations. It represents the most
widely accessible and low friction approach to teaching programming yet. 

### The first cohort

The time spent building the course was not spent talking to actual learners.
It's still very early days and we're is actively filling out the first user
cohort.

We have an excellent (totally unbiased...), *free* curriculum that anyone can
access. *_There's not even an email signup wall_*. Just go to the [Pairwise
Workspace](https://app.pairwise.tech/workspace/) and start coding.  This
beginning course can teach anyone the basics of programming and building a
website with HTML and CSS.

As we continue to build an audience we will also start to focus our effort on
building out our other course modules. When finished, our course will present
all of the topics and skills required to build and deploy a modern software app.
We're confident that by the end of the course learners will know enough to work
productively on a professional software team or kick-start their own startup
from scratch.

We're really excited about the future and looking forward to developing our
course content and getting to know our first users!
        `}
        />
      </ConstrainWidth>
    </Section>
  </Layout>
);

export default MediaKit;