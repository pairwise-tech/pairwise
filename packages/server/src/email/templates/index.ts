/** ===========================================================================
 * Email Templates
 * ----------------------------------------------------------------------------
 * This file provides email templates. To edit more complicated templates, such
 * as the Welcome Email, you can find the original email HTML in this same
 * sub-folder.
 *
 * The original HTML files are preserved here to make editing them and
 * previewing the result easier. Note that these files are not actually used
 * by the application, however. Instead, the inline text and HTML in this
 * file (which are produced from the HTML files) are used.
 *
 * You can edit these HTML files directly, and then use a conversion tool like
 * https://htmlemail.io/inline/ to convert the HTML document to inline-styles
 * to use as an email, and then copy the result into this file here.
 *
 * The HTML files are preserved in this folder, in addition to an index.html
 * which is used for editing HTML content directly. Open this with the
 * edit:email npm command.
 *
 * NOTE: The conversion tool may not work perfectly! You should verify the
 * output is correct, and you may need to search and use a different tool.
 * ============================================================================
 */

/** ===========================================================================
 * Email Registration Link
 * ============================================================================
 */

export const getMagicEmailLinkContents = (link: string) => {
  return {
    subject: "Welcome to Pairwise! 🎉",
    text: `Hi, welcome to Pairwise! Open this link to get started now: ${link}`,
    html: `Hi, welcome to Pairwise! Click <a href=${link}>this magic link</a> to get started now!`,
  };
};

/** ===========================================================================
 * Email Verification Link
 * ============================================================================
 */

export const getVerificationLinkContents = (link: string) => {
  return {
    subject: "Pairwise Email Verification",
    text: `Hi, please open this link to verify your email: ${link}`,
    html: `Hi, please <a href=${link}>open this link</a> to verify your email address.`,
  };
};

/** ===========================================================================
 * Welcome Email
 * ============================================================================
 */

const WELCOME_HTML = `
<html>
  <body style="margin: 0; padding: 0; color: rgb(35, 35, 35); background-color: rgb(245, 245, 245); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
        'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
        'Helvetica Neue', sans-serif;">
    <div class="top" style="padding-top: 32px; padding-bottom: 32px; background-color: rgb(35, 35, 35);">
      <div class="top-content" style="text-align: center; margin: auto; max-width: 500px;">
        <img alt="Pairwise Logo" src="https://avatars0.githubusercontent.com/u/59724684?s=200&v=4" style="height: 100px; width: 100px;" width="100" height="100">
        <h1 style="margin: 12px; color: white; font-size: 36px;">Welcome to Pairwise!</h1>
      </div>
    </div>
    <div class="bottom" style="margin: auto; max-width: 500px; padding-top: 12px; padding-bottom: 36px;">
      <div class="bottom-content" style="padding: 10px; max-width: 525px;">
        <h2>Thanks for joining!</h2>
        <p>
          We are so happy you signed up! Pairwise is a new product to teach
          people to code, and we want to design <i>the best</i> learning
          experience for you.
        </p>
        <p>
          If you haven't already, we recommend our
          <a target="_blank" href="https://app.pairwise.tech/workspace/yxZjmD0o/welcome-to-pairwise" style="color: blue; text-decoration: none;">Intro Challenge</a>
          on how the Pairwise platform works, or you get started with one of
          these challenges now:
        </p>
        <ul>
          <li>
            <a target="_blank" href="https://app.pairwise.tech/workspace/5ziJI35f/html-language-web" style="color: blue; text-decoration: none;">Intro to HTML</a>
          </li>
          <li>
            <a target="_blank" href="https://app.pairwise.tech/workspace/CuwykKRM/enter-css" style="color: blue; text-decoration: none;">Intro to CSS</a>
          </li>
          <li>
            <a target="_blank" href="https://app.pairwise.tech/workspace/2qKcNab8/intro" style="color: blue; text-decoration: none;">Intro to Programming</a>
          </li>
        </ul>
        <p>
          The curriculum is a linear series of challenges, projects and videos
          you can solve on your own time and schedule. We try to walk through
          all the skills and technologies required for you to learn how to build
          real world applications and land a job as a software engineer.
        </p>
        <p>
          If you ever have problems or suggestions, there is a feedback feature
          built into the Pairwise workspace for you to use. Or, feel free to
          just respond to this email to contact us directly. We love to hear
          from students and will try to reply to you directly.
        </p>
        <p>
          By the way, your account is uniquely identified by your email address.
          If you use another SSO provider to sign in, that account <b>must</b> match
          your existing email address, otherwise it will create a new account. Try 
          to keep this in mind if you use another SSO provider to sign in in the 
          future.
        </p>
        <h2>Thanks again! 🎉</h2>
        <i>- The Pairwise Team</i>
        <div class="break" style="margin-top: 16px; height: 1px; width: 100%; background-color: rgb(35, 35, 35);"></div>
        <p class="social-links" style="font-size: 12px;">
          Follow us on:
          <a target="_blank" href="https://www.youtube.com/channel/UCG52QHurjYWfqFBQR_60EUQ" style="color: blue; text-decoration: none;">YouTube</a>
          |
          <a target="_blank" href="https://twitter.com/PairwiseTech" style="color: blue; text-decoration: none;">Twitter</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;

const WELCOME_TEXT = `
We are so happy you signed up! Pairwise is a new product to teach people to code, and we want to design the best learning experience for you.

You get started with one of these topics now:

Intro to Pairwise: https://app.pairwise.tech/workspace/yxZjmD0o/welcome-to-pairwise
Intro to HTML: https://app.pairwise.tech/workspace/5ziJI35f/html-language-web
Intro to CSS: https://app.pairwise.tech/workspace/CuwykKRM/enter-css
Intro to Programming: https://app.pairwise.tech/workspace/2qKcNab8/intro

The curriculum is a linear series of challenges, projects and videos you can solve on your own time and schedule. We try to walk through all the skills and technologies required for you to learn how to build real world applications and land a job as a software engineer.

If you ever have problems or suggestions, there is a feedback feature built into the Pairwise workspace for you to use. Or, feel free to just respond to this email to contact us directly. We love to hear from students and will try to reply to you directly.

By the way, your account is uniquely identified by your email address. If you use another SSO provider to sign in, that account <b>must</b> match your existing email address, otherwise it will create a new account. Try  to keep this in mind if you use another SSO provider to sign in in the future.

Thanks again! 🎉

- The Pairwise Team
`;

export const getWelcomeEmailContents = () => {
  return {
    subject: "Welcome to Pairwise! 💫",
    html: WELCOME_HTML,
    text: WELCOME_TEXT,
  };
};

/** ===========================================================================
 * Payment Confirmation Email
 * ============================================================================
 */

const PAYMENT_CONFIRMATION_HTML = `
<html>
  <body style="margin: 0; padding: 0; color: rgb(35, 35, 35); background-color: rgb(245, 245, 245); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
        'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
        'Helvetica Neue', sans-serif;">
    <div class="top" style="padding-top: 32px; padding-bottom: 32px; background-color: rgb(35, 35, 35);">
      <div class="top-content" style="text-align: center; margin: auto; max-width: 500px;">
        <img alt="Pairwise Logo" src="https://avatars0.githubusercontent.com/u/59724684?s=200&v=4" style="height: 100px; width: 100px;" width="100" height="100">
        <h1 style="margin: 12px; color: white; font-size: 36px;">Thank You!</h1>
      </div>
    </div>
    <div class="bottom" style="margin: auto; max-width: 500px; padding-top: 12px; padding-bottom: 36px;">
      <div class="bottom-content" style="padding: 10px; max-width: 525px;">
        <h2>Thank you for purchasing the Pairwise FullStack Web Development Course!</h2>
        <p>
          We genuinely appreciate your support, and hope to provide you with the best learning experience possible. In addition to the
          initial modules which cover HTML, CSS, and TypeScript, the course covers the following topics:
        </p>
        <ul>
          <li style="font-style: italic;">
            Async Programming & APIs
          </li>
          <li style="font-style: italic;">
            Frontend Programming
          </li>
          <li style="font-style: italic;">
            Backend Programming
          </li>
          <li style="font-style: italic;">
            Databases
          </li>
          <li style="font-style: italic;">
            Mobile Development
          </li>
          <li style="font-style: italic;">
            Testing Software
          </li>
          <li style="font-style: italic;">
            Refactoring & Debugging
          </li>
          <li style="font-style: italic;">
            Delivery & Deployment
          </li>
          <li style="font-style: italic;">
            Capstone Projects
          </li>
          <li style="font-style: italic;">
            Career & Interview
          </li>
        </ul>
        <p>
          We recommend trying to work through the course in the sequence it is presented in. However, you are free to skip
          around as you see fit.
        </p>
        <p>
          <b>NOTE:</b> The course is still in beta right now. What this means is a lot of content is still being actively developed.
          You will see the course content changing frequently, and new features being added to the platform.
        </p>
        <h2>Thanks again! 🎉</h2>
        <i>- Sean, Pairwise Founder</i>
        <div class="break" style="margin-top: 16px; height: 1px; width: 100%; background-color: rgb(35, 35, 35);"></div>
        <p class="small-text" style="font-size: 12px;">
          Follow us on:
          <a target="_blank" href="https://www.youtube.com/channel/UCG52QHurjYWfqFBQR_60EUQ" style="color: blue; text-decoration: none;">YouTube</a>
          |
          <a target="_blank" href="https://twitter.com/PairwiseTech" style="color: blue; text-decoration: none;">Twitter</a>
        </p>
        <p class="small-text" style="font-size: 12px;">
          * If you have any questions, please just respond to this email. You can also request a refund up to
          30 days after your purchase.
        </p>
      </div>
    </div>
  </body>
</html>
`;

const PAYMENT_CONFIRMATION_TEXT = `
Thank you for purchasing the Pairwise FullStack Web Development Course!

We genuinely appreciate your support, and hope to provide you with the best learning experience possible. In addition to the initial modules which cover HTML, CSS, and TypeScript, the course covers the following topics:

- Async Programming & APIs
- Frontend Programming
- Backend Programming
- Databases
- Mobile Development
- Testing Software
- Refactoring & Debugging
- Delivery & Deployment
- Capstone Projects
- Career & Interview

We recommend trying to work through the course in the sequence it is presented in. However, you are free to skip around as you see fit.

NOTE: The course is still in beta right now. What this means is a lot of content is still being actively developed. You will see the course content changing frequently, and new features being added to the platform.

Thanks again! 🎉

- Sean, Pairwise Founder

* If you have any questions, please just respond to this email. You can also request a refund up to 30 days after your purchase.

* By the way, your course purchase is linked to your account for this email address. If you login with a different SSO provider in the future (which is associated with another email address) a <i>new</i> Pairwise account will be created and you may be confused. Pairwise identifies accounts by relying on unique email addresses. Always login to Pairwise using the same SSO provider or email address to avoid any problems, thank you!
`;

export const getPaymentConfirmationEmail = () => {
  return {
    subject: "Pairwise Payment Confirmation 💫",
    html: PAYMENT_CONFIRMATION_HTML,
    text: PAYMENT_CONFIRMATION_TEXT,
  };
};
