import ContentUtility from "../tools/content-utility-class";
import { isValidPortfolioSkill, PortfolioSkills } from "../types/courses";

describe("ContentUtilityClass", () => {
  test("All skillTags match the provided type definition for PortfolioSkills", () => {
    const courseSkeletons = ContentUtility.getCourseNavigationSkeletons();

    const verifySkillTags = (skillTags: PortfolioSkills[] | undefined) => {
      if (skillTags) {
        for (const skill of skillTags) {
          expect(isValidPortfolioSkill(skill)).toBe(true);
        }
      }
    };

    // Perform validation on all skill tags attached to modules or challenges
    for (const course of courseSkeletons) {
      for (const module of course.modules) {
        verifySkillTags(module.skillTags);
        for (const challenge of module.challenges) {
          verifySkillTags(challenge.skillTags);
        }
      }
    }
  });
});
