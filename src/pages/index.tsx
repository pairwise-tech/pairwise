import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"
import { Repositories } from "../components/repositories"

const IndexPage = () => {
  return (
    <Layout>
      <SEO
        title="Home"
        description="This is the personal website of Benedikt Franke"
      />
      <h1>Hi people</h1>
      <div style={{ maxWidth: `300px`, marginBottom: `1.45rem` }}>
        <Image />
      </div>
      <h2>Open Source</h2>
      <Repositories />
      <Link to="/page-2/">Go to page 2</Link>
    </Layout>
  )
}

export default IndexPage
