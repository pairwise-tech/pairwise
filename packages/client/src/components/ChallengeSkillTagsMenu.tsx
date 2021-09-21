import React from "react";
import { AppTheme, PortfolioSkills, SkillTags } from "@pairwise/common";
import { Button, Icon } from "@blueprintjs/core";
import { Select, IListItemsProps } from "@blueprintjs/select";
import { mapSkillToDeviconClassName } from "tools/utils";
import { getRenderItemList } from "./SharedComponents";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

// NOTE: This default behavior of this select is overridden to allow for
// selecting multiple active items at once.
const ChallengeTypeSelect = Select.ofType<PortfolioSkills>();

interface Props {
  items: SkillTags;
  appTheme: AppTheme;
  currentSkillTags?: SkillTags;
  onItemSelect: IListItemsProps<PortfolioSkills>["onItemSelect"];
}

/** ===========================================================================
 * Component
 * ============================================================================
 */

const ChallengeTypeMenu = ({
  items,
  appTheme,
  onItemSelect,
  currentSkillTags = [],
}: Props) => {
  const isActiveTag = (tag: PortfolioSkills) => {
    return currentSkillTags.includes(tag);
  };

  const activeItem = items.find(isActiveTag);

  return (
    <div style={{ flexShrink: 0, marginLeft: 9, marginRight: 0 }}>
      <ChallengeTypeSelect
        items={items}
        filterable={false}
        activeItem={activeItem}
        onItemSelect={onItemSelect}
        itemListRenderer={getRenderItemList(150)}
        itemRenderer={(tag, { handleClick }) => (
          <Button
            key={tag}
            text={tag}
            style={{ flexShrink: 0 }}
            id={`challenge-skill-tag-${tag}`}
            onClick={handleClick}
            active={isActiveTag(tag)}
            rightIcon={isActiveTag(tag) ? "tick" : null}
            icon={<i className={mapSkillToDeviconClassName(tag, appTheme)} />}
          />
        )}
      >
        <Button
          aria-haspopup="true"
          rightIcon="caret-down"
          aria-controls="simple-menu"
          id="codepress-skill-tags-select-menu"
        >
          <Icon style={{ margin: "0 2px" }} icon="tag" />
          <strong style={{ marginLeft: 6 }}>Skill Tags</strong>
        </Button>
      </ChallengeTypeSelect>
    </div>
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ChallengeTypeMenu;
