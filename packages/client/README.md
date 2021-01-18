# Pairwise Client Application

This is the Pairwise client application! This is the core product which provides the curriculum and workspace to users. This package also includes `codepress` which is an internal CMS tool for managing and writing course content. Codepress is built directly into the client application.

# Getting Started

```shell
# Run the application
$ yarn start:dev

# Run Codepress
$ yarn start:codepress

# Run the tests
$ yarn test

# Build the application
$ yarn build
```

# Tests

The unit tests for this package includes a test suite to test all of the challenges solution code against their test code. You can see it in `Torvalds.test.ts`.

# HTTPS for Local Development

Visit chrome://flags/#allow-insecure-localhost in Chrome and enable the option to prevent warnings about insecure https on localhost.

# Codepress

## Special Markdown

The Codepress rich-text editor has some special markdown-like syntax to make highlighting and linking easier:

### Highlight

This highlights text in light yellow and underlines it:

```md
++I'm highlighted and underlined!++
```

### Video Play Button

This syntax renders a clickable video-icon button in its place which smooth scrolls a video into view and auto-plays it:

```md
Checkout the @video@ explanation below!
```

### Content Link

This syntax renders a hyperlinked "content" in its place which smooth scrolls the content area into view:

```md
Checkout the @content@ area below for more info.
```

## Special Links

In addition to external URLs, codepress offers a few different ways to effectively navigate within the app when using the rich-text editor's :link: feature:

### Custom Smooth Scroll Link

Similar to the above `@content@` syntax, codepress has a more flexible way to smooth scroll to the content area as well:

```md
You can find more information about this topic [below](/scrollTarget/supplementary-content-container).
```

This is also useful for smooth scrolling back to the instructions/code editor from the content area:

```md
As you saw in the example [above](/scrollTarget/root) ...
```

### Link to Challenge

You can also use the editing toolbar's link tool to link to challenges. Add `/workspace/{challengeId}` in the link input, or simply begin typing the name of challenge, choose from the list, and the link will be auto-created for you.
