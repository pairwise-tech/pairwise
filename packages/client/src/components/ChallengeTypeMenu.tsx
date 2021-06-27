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
  currentChallengeType,
  onItemSelect,
  tooltip = true,
}: Props) => {
  const activeItem = items.find((x) => x.value === currentChallengeType);
  return (
    <div style={{ flexShrink: 0, marginLeft: 10, marginRight: 10 }}>
      <ChallengeTypeSelect
        filterable={false}
        onItemSelect={onItemSelect}
        activeItem={activeItem}
        items={items}
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
          id="selectChallengeType"
          rightIcon="caret-down"
          aria-controls="simple-menu"
          aria-haspopup="true"
        >
          {tooltip && (
            <Tooltip2
              content="Choose what type of code you will write"
              usePortal={false}
            >
              <Icon style={{ margin: "0 2px" }} icon="info-sign" />
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
