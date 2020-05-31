/* eslint-disable */
// See this, ha! ~ https://github.com/facebook/create-react-app/issues/8014

import { Options } from "prettier";
import parserHtml from "prettier/parser-html";
import parserCss from "prettier/parser-postcss";
import parserTypescript from "prettier/parser-typescript";
import { format } from "prettier/standalone";

type ParserPlugins = Partial<Options>;

self.addEventListener("message", (event: MessageEvent) => {
  try {
    const { code, type, channel } = event.data;
    const parserPlugins: ParserPlugins =
      type === "markup"
        ? {
            parser: "html",
            plugins: [parserHtml, parserCss],
          }
        : {
            parser: "typescript",
            plugins: [parserTypescript],
          };
    const formatted = format(code, {
      ...parserPlugins,
      arrowParens: "always",
      trailingComma: "es5",
      tabWidth: 2,
    });

    // @ts-ignore
    self.postMessage({ code: formatted, type, channel });
  } catch (err) {
    console.warn(`Error encountered running Format Code: ${err.message}`);
    // The formatting may fail, which usually means the input is malformed
    // in some way and could not be formatted. In this case, ignore the
    // error and leave the code unchanged.
  }
});
