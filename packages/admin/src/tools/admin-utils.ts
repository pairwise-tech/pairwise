import { AdminUserView } from "../modules/users/store";

/**
 * Parse the course progress.
 */
const formatChallengeProgress = (progressHistory: any) => {
  return progressHistory.map((p: any) => ({
    ...p,
    progress: JSON.parse(p.progress),
  }));
};

/**
 * Count the total completed challenges for a user.
 */
const countCompletedChallenges = (progress: any) => {
  return progress.reduce(
    (summary: { total: number }, courseProgress: any) => {
      const count = Object.keys(courseProgress.progress).length;
      return {
        ...summary,
        total: summary.total + count,
        [courseProgress.courseId]: count,
      };
    },
    { total: 0 },
  );
};

/**
 * Remove some extra user fields to make the JSON output easier to read.
 */
const removeExcessUserFields = (user: AdminUserView) => {
  return {
    uuid: user.uuid,
    email: user.email,
    displayName: user.displayName,
    givenName: user.givenName,
    familyName: user.familyName,
    settings: user.settings,
    payments: user.payments,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Whitelist our emails
const WHITELISTED_EMAILS = new Set([
  "sean.smith.2009@gmail.com",
  "pweinberg633@gmail.com",
  "ian989@gmail.com",
  "ian@iansinnott.com",
]);

// Whitelist some users who don't have an email
const WHITELIST_UUID_LIST = new Set([
  "89794e45-ee52-424e-9d79-77e1da64d7a0", // Ian
  "cf26bc29-1591-479e-bb58-241c255cc331", // Peter
]);

/**
 * Remove ourselves from the user list.
 */
const filterUsOut = (user: AdminUserView) => {
  const { email, uuid } = user;
  if (!email) {
    return true;
  }

  const excludeUser =
    WHITELIST_UUID_LIST.has(uuid) ||
    WHITELISTED_EMAILS.has(email) ||
    email.includes("@pairwise.tech");

  if (excludeUser) {
    return false;
  } else {
    return true;
  }
};

export const summarizeUserProgress = (users: AdminUserView[]) => {
  const withProgressSummaries = users.filter(filterUsOut).map(user => {
    // Format the progress history
    const formattedProgress = formatChallengeProgress(
      user.challengeProgressHistory,
    );

    // Get all completed challenges count
    const completedChallenges = countCompletedChallenges(formattedProgress);

    // Get completed challenges
    const completedChallengeList = formattedProgress.reduce(
      (result: any, courseProgress: any) =>
        result.concat(Object.values(courseProgress.progress)),
      [],
    );

    // Get only the completed challenge ids
    const completedChallengeIds = formattedProgress.reduce(
      (result: any, courseProgress: any) =>
        result.concat(Object.keys(courseProgress.progress)),
      [],
    );

    return {
      ...removeExcessUserFields(user),
      completedChallenges,
      completedChallengeList,
      completedChallengeIds,
    };
  });

  // Sort by completed challenge count
  const sortedByCompletedChallenges = withProgressSummaries.sort((a, b) => {
    return b.completedChallenges.total - a.completedChallenges.total;
  });

  // Record some stats
  let totalChallengesCompleted = 0;
  let challengesCompletedInLastWeek = 0;
  let newUsersInLastWeek = 0;
  let usersWithoutEmail = 0;
  let leaderChallengeCount = 0;
  let numberOfUsersWithZeroChallengesComplete = 0;
  let nonZeroChallengeUsers = 0;

  for (const user of withProgressSummaries) {
    const { completedChallengeList } = user;
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const lastWeek = now - oneWeek;

    leaderChallengeCount = Math.max(
      leaderChallengeCount,
      completedChallengeList.length,
    );

    if (!user.email) {
      usersWithoutEmail++;
    }

    if (completedChallengeList.length === 0) {
      numberOfUsersWithZeroChallengesComplete++;
    } else {
      nonZeroChallengeUsers++;
    }

    const userCreated = new Date(user.createdAt).getTime();
    if (userCreated > lastWeek) {
      newUsersInLastWeek++;
    }

    for (const challenge of completedChallengeList) {
      totalChallengesCompleted++;

      if (!!challenge.timeCompleted) {
        const challengeCompleted = new Date(challenge.timeCompleted).getTime();
        if (challengeCompleted > lastWeek) {
          challengesCompletedInLastWeek++;
        }
      }
    }

    delete user.completedChallengeList;
  }

  const totalUsers = sortedByCompletedChallenges.length;

  // The average challenge completed count excludes users with zero
  // challenges completed
  const averageChallengesCompletedPerNonZeroUser = Math.round(
    totalChallengesCompleted / nonZeroChallengeUsers,
  );

  // Create summary with total user count
  const summary = {
    stats: {
      totalUsers,
      newUsersInLastWeek,
      usersWithoutEmail,
      totalChallengesCompleted,
      challengesCompletedInLastWeek,
    },
    leaderboard: {
      leaderChallengeCount,
      averageChallengesCompletedPerNonZeroUser,
      numberOfUsersWithZeroChallengesComplete,
    },
    users: sortedByCompletedChallenges,
  };

  return summary;
};
