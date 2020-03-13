declare module "@babel/standalone";
declare module "console-feed";

type Nullable<T> = T | null;

declare module "rich-markdown-editor" {
  import * as React from "react";
  import * as SlateReact from "slate-react";

  /**
   * For some reason the slate typings on definitely typed didn't include render
   * node but did include render block. When using plugins with
   * rich-markdown-editor@9.11.2 I was only seeing renderNode getting called
   */
  export interface SlatePlugin extends SlateReact.Plugin {
    renderNode?: SlateReact.Plugin["renderBlock"];
  }

  /**
   * These are unofficial typings so they may not be perfect or some props might
   * be omitted because we weren't using them at the time. See the docs:
   * https://github.com/outline/rich-markdown-editor#props
   */
  export interface EditorProps {
    id?: string;
    defaultValue?: string;
    placeholder?: string;
    pretitle?: string;
    plugins?: SlatePlugin[];
    autoFocus?: boolean;
    readOnly?: boolean;
    headingsOffset?: number;
    toc?: boolean;
    dark?: boolean;
    schema?: Schema;
    theme?: Object;
    uploadImage?: (file: File) => Promise<string>;
    onSave?: ({ done }: { done?: boolean }) => void;
    onCancel?: () => void;
    onChange?: (getValue: () => string) => void;
    onImageUploadStart?: () => void;
    onImageUploadStop?: () => void;
    onSearchLink?: (term: string) => Promise<SearchResult[]>;
    onClickLink?: (href: string) => void;
    onShowToast?: (message: string) => void;
    onClickHashtag?: (tag: string) => void;
    className?: string;
    style?: Object;
    spellCheck?: boolean;
  }

  export const Editor: React.FC<EditorProps>;

  export default Editor;
}

declare module "rich-markdown-editor/lib/lib/headingToSlug" {
  import { Document, Block, Node as SlateNode } from "slate";
  export default function headingToSlug(
    document: Document,
    node: SlateNode,
  ): string;
}

declare module "string-quote-x" {
  const quote: (str: string) => string;
  export default quote;
}

declare module "strip-comments" {
  export default function stripComments(s: string): string;
}
