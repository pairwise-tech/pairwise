import * as React from "react";
import styled from "styled-components";
import { Editor } from "slate-react";

import { Block } from "slate";
import headingToSlug from "rich-markdown-editor/lib/lib/headingToSlug";
import { PROSE_MAX_WIDTH } from "tools/constants";

export default class TableOfContents extends React.Component<
  {
    editor: Editor;
  },
  {
    isFixed: boolean;
    left: number;
  }
> {
  wrapperRef = React.createRef<HTMLDivElement>();

  state = {
    isFixed: false,
    left: PROSE_MAX_WIDTH + 40,
  };

  componentDidMount() {
    window.document.addEventListener("click", this.smoothScrollToHeading);
    window.addEventListener("scroll", this.updateScrollState);
    setImmediate(this.updateScrollState);
  }

  componentWillUnmount() {
    window.document.removeEventListener("click", this.smoothScrollToHeading);
    window.removeEventListener("scroll", this.updateScrollState);
  }

  /**
   * @NOTE The way that the underlying lib slugifies titles is flawed in that it
   * will allow characters such as period which are invalid in a selector.
   * However, getElementById is happy to oblige so we go with that instead.
   */
  smoothScrollToHeading = (e: MouseEvent) => {
    try {
      const el = e.target as HTMLElement;
      const href = el?.getAttribute("href");
      if (href && href.startsWith("#")) {
        const id = href.slice(1); // #some-id -> some-id. Also, see NOTE
        window.document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth" });

        // Prevent default late so that if the above fails the default will not
        // have been prevented
        e.preventDefault();
      }
    } catch (err) {
      console.warn(
        "[INFO] Could not smooth scroll to header. Will fall back to default browser behavior.",
      );
    }
  };

  updateScrollState = () => {
    const parent = this.wrapperRef.current?.parentElement;

    if (!parent) {
      return;
    }

    const box = parent.getBoundingClientRect();
    const isFixed = box.top < 40;
    const left = box.width + (isFixed ? box.x : 0) + 40;

    if (this.state.isFixed !== isFixed || this.state.left !== left) {
      this.setState({ isFixed, left });
    }
  };

  getHeadings() {
    const { editor } = this.props;

    // Third party typing issue
    // @ts-ignore
    return editor.value.document.nodes.filter((node?: Block) => {
      if (!node || !node.text) {
        return false;
      }
      return Boolean(node.type.match(/^heading/));
    });
  }

  render() {
    const { editor } = this.props;
    const headings = this.getHeadings();

    // If there are one or less headings in the document no need for a minimap
    if (headings.size <= 1) {
      return null;
    }

    return (
      <Wrapper
        ref={this.wrapperRef}
        style={{
          position: this.state.isFixed ? "fixed" : "absolute",
          top: this.state.isFixed ? 40 : 0,
          left: this.state.left,
        }}
      >
        <h4>Table of Contents</h4>
        <Sections>
          {headings.map((heading?: Block) => {
            if (!heading) {
              return null;
            }

            // Third party typing issue
            // @ts-ignore
            const slug = headingToSlug(editor.value.document, heading);

            return (
              <ListItem key={slug} style={{ marginLeft: -1 }}>
                <Anchor
                  href={`#${slug}`}
                  style={{
                    // Indent based on heading level
                    marginLeft: Number(heading.type.match(/(\d)/)?.[0]) * 8,
                  }}
                >
                  {heading.text}
                </Anchor>
              </ListItem>
            );
          })}
        </Sections>
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  font-family: ${props => props.theme.fontFamily};
  font-weight: ${props => props.theme.fontWeight};
  font-size: 1em;
  line-height: 1.4;
  z-index: 5;
  border: 1px solid #404040;
  border-radius: 2px;
  background: #292929;
  flex-grow: 0;
  flex-shrink: 0;
  width: 300px;

  h4 {
    padding: 5px;
    margin: 0;
    font-variant: small-caps;
    text-transform: uppercase;
    font-weight: 700;
    font-size: 12px;
    border-bottom: 1px solid #404040;
    background: #404040;
  }

  @media print {
    display: none;
  }
`;

const Anchor = styled.a`
  display: block;
  font-weight: 400;
  transition: all 100ms ease-in-out;
  padding: 8px 5px;
  text-overflow: ellipsis;
  text-decoration: none;
`;

const ListItem = styled.div`
  display: block;
  border-bottom: 1px solid #404040;
  position: relative;
  white-space: nowrap;
  a {
    color: #cacaca;
  }
  &:hover {
    background: #212121;
    a {
      color: white;
    }
  }
`;

const Sections = styled.div`
  padding: 0;
  margin: 0;
  list-style: none;
  font-size: 13px;
  width: 300px;
  transition-delay: 1s;
  transition: width 100ms ease-in-out;
`;
