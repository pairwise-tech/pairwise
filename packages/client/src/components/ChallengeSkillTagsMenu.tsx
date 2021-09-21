import React from "react";
import {
  AppTheme,
  CHALLENGE_TYPE,
  PortfolioSkills,
  SkillTags,
} from "@pairwise/common";
import { Button, Icon } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import { Select, IListItemsProps } from "@blueprintjs/select";
import { mapSkillToDeviconClassName } from "tools/utils";
import { getRenderItemList } from "./SharedComponents";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const ChallengeTypeSelect = Select.ofType<PortfolioSkills>();

interface Props {
  items: SkillTags;
  appTheme: AppTheme;
  currentSkillTags?: SkillTags;
  currentChallengeType?: CHALLENGE_TYPE;
  onItemSelect: IListItemsProps<PortfolioSkills>["onItemSelect"];
  tooltip?: boolean;
}

/** ===========================================================================
 * Component
 * ============================================================================
 */

const ChallengeTypeMenu = ({
  items,
  appTheme,
  onItemSelect,
  tooltip = true,
  currentSkillTags,
  currentChallengeType,
}: Props) => {
  const activeItem = items.find(
    (x) => currentSkillTags && currentSkillTags.includes(x),
  );
  return (
    <div style={{ flexShrink: 0, marginLeft: 9, marginRight: 0 }}>
      <ChallengeTypeSelect
        items={items}
        filterable={false}
        activeItem={activeItem}
        onItemSelect={onItemSelect}
        itemListRenderer={getRenderItemList(150)}
        itemRenderer={(x, { handleClick, modifiers }) => (
          <Button
            id={`challenge-skill-tag-${x}`}
            style={{ flexShrink: 0 }}
            key={x}
            text={x}
            onClick={handleClick}
            active={modifiers.active}
            icon={<i className={mapSkillToDeviconClassName(x, appTheme)} />}
          />
        )}
      >
        <Button
          aria-haspopup="true"
          rightIcon="caret-down"
          id="codepressSkillTagsSelectMenu"
          aria-controls="simple-menu"
        >
          {tooltip && (
            <Tooltip2
              usePortal={false}
              content="Choose skill tags for this challenge"
            >
              <Icon style={{ margin: "0 2px" }} icon="tag" />
            </Tooltip2>
          )}
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
