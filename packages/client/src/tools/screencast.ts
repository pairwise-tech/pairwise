const learnToCode = () => {
  const requiredSkills = [
    "HTML",
    "CSS",
    "TypeScript",
    "React",
    "NodeJS",
    "Express",
    "Postgres",
    "Docker",
  ];

  let skills = [];
  let experiencePoints = 0;

  while (requiredSkills.length > 0) {
    buildProjects();
    solveChallenges();

    experiencePoints++;

    if (experiencePoints % 100 === 0) {
      skills.push(requiredSkills.pop());
    }
  }

  getHired();
};

const buildProjects = () => null;
const solveChallenges = () => null;
const getHired = () => null;
export const a = null;
learnToCode();
