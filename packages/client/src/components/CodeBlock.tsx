import React from "react";
import ReactSyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";

/**
 * CodeBlock highlights code syntax using ReactSyntaxHighligher. The reason
 * it's over here is that it imports a lot of code, so I wanted to lazy-load it
 * in order to bloat the bundle less.
 */

interface Props {
  value: string;
  language?: string;
}

const CodeBlock = ({ value, language }: Props) => {
  return (
    <ReactSyntaxHighlighter style={vs2015} language={language}>
      {value}
    </ReactSyntaxHighlighter>
  );
};

export default CodeBlock;
