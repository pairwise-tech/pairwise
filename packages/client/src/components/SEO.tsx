import React from "react";
import Helmet from "react-helmet";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

type MetaProps = JSX.IntrinsicElements["meta"];

interface SEOProps {
  title: string;
  description?: string;
  lang?: string;
}

const DEFAULT_DESCRIPTION =
  "Learn to code with hands-on challenges and projects";

/** ===========================================================================
 * SEO Component
 * ============================================================================
 */

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  lang = "en",
}: SEOProps) => {
  const metaTags: MetaProps[] = [
    {
      name: "description",
      content: description,
    },
    {
      name: "twitter:card",
      content: "summary",
    },
    {
      name: "twitter:title",
      content: title,
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      property: "og:title",
      content: title,
    },
    {
      property: "og:description",
      content: description,
    },
    {
      property: "og:type",
      content: "website",
    },
  ];

  return (
    <Helmet
      htmlAttributes={{ lang }}
      title={title}
      titleTemplate={`%s | Pairwise Workspace`}
    >
      {metaTags.map((meta) => {
        return <meta key={Object.values(meta).join("-")} {...meta} />;
      })}
    </Helmet>
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default SEO;
