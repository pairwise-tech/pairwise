import React from "react"
import { Link } from "gatsby"

import Layout from "../components/Layout"
import SEO from "../components/SEO"

const IndexPage = () => {
  return (
    <Layout>
      <SEO
        title="Home"
        description="This is the personal website of Benedikt Franke"
      />
      <h1>Hi people</h1>
      <h2>Open Source</h2>
      <Link to="/page-2/">Go to page 2</Link>
    </Layout>
  )
}

export default IndexPage
