import { Link } from "gatsby"
import Container from "@material-ui/core/Container"
import React from "react"

import styled from "styled-components"

import Layout from "../components/Layout"
import SEO from "../components/SEO"

// Can overwrite this later with internationalization if we need it.
const t = (s: string) => s

const MainContainer = styled(Container)`
  padding-top: 40px;
`

const Main = () => {
  return (
    <MainContainer>
      <h1>
        {t(
          "Learn to code with hands-on, immersive, project-based instruction.",
        )}
      </h1>
      <Link to="/page-2/">Go to page 2</Link>
      Pal
    </MainContainer>
  )
}

const IndexPage = () => {
  return (
    <Layout hideHeader>
      <SEO
        title="Learn to code"
        description="Learn to code with hands-on, immersive, project-based instruction."
      />
      <Main />
    </Layout>
  )
}

export default IndexPage
