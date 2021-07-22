import React from "react";
import { CHALLENGE_TYPE } from "@pairwise/common";
import { Button, Icon } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import { Select, IListItemsProps } from "@blueprintjs/select";
import { getChallengeIcon } from "tools/utils";
import { getRenderItemList, labelByType } from "./SharedComponents";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const ChallengeTypeSelect = Select.ofType<ChallengeTypeOption>();

export interface ChallengeTypeOption {
  value: CHALLENGE_TYPE;
  label: string;
}

export const SANDBOX_TYPE_CHOICES: ChallengeTypeOption[] = [
  { value: "markup", label: "HTML/CSS" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
];

interface Props {
  items: ChallengeTypeOption[];
  currentChallengeType?: CHALLENGE_TYPE;
  onItemSelect: IListItemsProps<ChallengeTypeOption>["onItemSelect"];
  tooltip?: boolean;
}

/** ===========================================================================
 * Component
 * ============================================================================
 */

const ChallengeTypeMenu = ({
  items,
  onItemSelect,
  tooltip = true,
  currentChallengeType,
}: Props) => {
  const activeItem = items.find((x) => x.value === currentChallengeType);
  return (
    <div style={{ flexShrink: 0, marginLeft: 10, marginRight: 10 }}>
      <ChallengeTypeSelect
        items={items}
        filterable={false}
        activeItem={activeItem}
        onItemSelect={onItemSelect}
        itemListRenderer={getRenderItemList(150)}
        itemRenderer={(x, { handleClick, modifiers }) => (
          <Button
            id={`challenge-type-${x.value}`}
            style={{ flexShrink: 0 }}
            key={x.value}
            text={x.label}
            onClick={handleClick}
            active={modifiers.active}
            icon={getChallengeIcon(x.value, true)}
          />
        )}
      >
        <Button
          aria-haspopup="true"
          rightIcon="caret-down"
          id="selectChallengeType"
          aria-controls="simple-menu"
        >
          {tooltip && (
            <Tooltip2
              content="Choose what type of code you will write"
              usePortal={false}
            >
              <Icon style={{ margin: "0 2px" }} icon="annotation" />
            </Tooltip2>
          )}
          <strong style={{ marginLeft: 6 }}>
            {labelByType(currentChallengeType, items)}
          </strong>
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
