import * as React from "react";
import styled from "styled-components/macro";
import { Editor } from "slate-react";

import { Block } from "slate";
import headingToSlug from "rich-markdown-editor/lib/lib/headingToSlug";
import { PROSE_MAX_WIDTH, COLORS, MOBILE } from "tools/constants";
import { LineWrappedText } from "./Shared";

const TOP_SPACING = 80;

// Get all headings from a slate editor
const getHeadings = (editor: Editor) => {
  // Third party typing issue
  // @ts-ignore
  return editor.value.document.nodes.filter((node?: Block) => {
    if (!node || !node.text) {
      return false;
    }
    return Boolean(node.type.match(/^heading/));
  });
};

export default class TableOfContents extends React.Component<
  {
    editor: Editor;
  },
  {
    isFixed: boolean;
    left: number;
  }
> {
  // Expose the get headings functionality so that calling code can determine
  // whether or not to render the TOC. Using the render method of this class was
  // great until I started wrapping the TOC in other UI.
  static getHeadings = getHeadings;

  wrapperRef = React.createRef<HTMLDivElement>();

  state = {
    isFixed: false,
    left: PROSE_MAX_WIDTH - 90 + 40,
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
   * Smoothly scroll the browser window to a heading, rather than jumping
   * instantaneously.
   *
   * @NOTE The way that the underlying lib slugifies titles is flawed in that it
   * will allow characters such as period which are invalid in a selector.
   * However, getElementById is happy to oblige so we go with that instead.
   * @NOTE Since default is prevented we have to _manually_ update the URL to
   * include the hash. This is how the browser works by default, so that if the
   * user refreshes they will refresh into the header they last linked to.
   * Setting window.location.hash = '...' will still trigger an immediate jump
   * to the header so it would break the smooth scroll.
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

        // See NOTE
        window.history.pushState(
          null,
          document.head.title,
          window.location.pathname + href,
        );

        // Prevent default late so that if the above fails the default will not
        // have been prevented
        e.preventDefault();
      }
    } catch (err) {
      // - Maybe some browser will consider the passed ID invalid (just like
      //   chrome does with querySelector('#id..'))
      // - Maybe the browser simply doesn't support this feature yet
      // Either way, it's fine if this fails, the fallback is default browser
      // jump-to-anchor behavior
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
    const isFixed = box.top < TOP_SPACING;
    const left = isFixed ? box.x : 0;

    if (this.state.isFixed !== isFixed || this.state.left !== left) {
      this.setState({ isFixed, left });
    }
  };

  render() {
    const { editor } = this.props;
    const headings = getHeadings(editor);

    // If there are one or less headings in the document no need for a minimap
    if (headings.size <= 1) {
      return null;
    }

    const isMobile = window.matchMedia(MOBILE).matches;

    return (
      <Wrapper
        ref={this.wrapperRef}
        style={{
          position: isMobile
            ? "static"
            : this.state.isFixed
            ? "fixed"
            : "absolute",
          top: this.state.isFixed ? TOP_SPACING : 0,
          left: this.state.left,
        }}
      >
        <h4 style={{ marginRight: -1 }}>Table of Contents</h4>
        <Sections style={{ marginRight: -1 }}>
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
                  as="a"
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
  font-family: ${(props) => props.theme.fontFamily};
  font-weight: ${(props) => props.theme.fontWeight};
  font-size: 1em;
  line-height: 1.4;
  z-index: 5;
  border: 1px solid ${COLORS.LIGHT_GREY};
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
    border-bottom: 1px solid ${COLORS.LIGHT_GREY};
    background: ${COLORS.LIGHT_GREY};
  }

  @media ${MOBILE} {
    margin-bottom: 20px;
  }

  @media print {
    display: none;
  }
`;

const Anchor = styled(LineWrappedText)`
  display: block;
  font-weight: 400;
  transition: all 100ms ease-in-out;
  padding: 8px 5px;
  text-decoration: none;
`;

const ListItem = styled.div`
  display: block;
  position: relative;
  white-space: nowrap;
  a {
    color: #cacaca;
  }
  &:not(:last-child) {
    border-bottom: 1px solid ${COLORS.LIGHT_GREY};
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
  transition-delay: 1s;
  transition: width 100ms ease-in-out;
`;
