/* eslint-disable @typescript-eslint/camelcase */
module.exports = {
  siteMetadata: {
    title: `Pairwise`,
    description: `Learn Full Stack TypeScript`,
    author: `Pairwise Team`,
  },
  plugins: [
    `gatsby-plugin-typescript`,
    'gatsby-plugin-material-ui',
    {
      resolve: `gatsby-plugin-styled-components`,
      options: {
        displayName: true,
        fileName: true,
      },
    },
    `gatsby-plugin-react-helmet`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/favicon2.png`, // This path is relative to the root of the site.
      },
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: 'UA-158972025-2',
        // Defines where to place the tracking script - `true` in the head and `false` in the body
        // GA recommends putting this in the head so here we are.
        head: true,
        // Aparently required in germany? https://www.gatsbyjs.org/packages/gatsby-plugin-google-analytics/#anonymize
        anonymize: true,
      },
    },
  ],
};
