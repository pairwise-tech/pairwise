import React from "react";
import { CHALLENGE_TYPE } from "@pairwise/common";
import { Button, Tooltip, Icon } from "@blueprintjs/core";
import { Select, IListItemsProps } from "@blueprintjs/select";
import { getChallengeIcon } from "tools/utils";
import { getRenderItemList, labelByType } from "./Shared";

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
  currentChallengeType?: string;
  onItemSelect: IListItemsProps<ChallengeTypeOption>["onItemSelect"];
}

/** ===========================================================================
 * Component
 * ============================================================================
 */

const ChallengeTypeMenu = ({
  items,
  currentChallengeType,
  onItemSelect,
}: Props) => {
  return (
    <ChallengeTypeSelect
      filterable={false}
      onItemSelect={onItemSelect}
      items={items}
      itemListRenderer={getRenderItemList(150)}
      itemRenderer={(x, { handleClick, modifiers }) => (
        <Button
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
        <Tooltip
          content="Choose what type of code you will write"
          usePortal={false}
        >
          <Icon style={{ margin: "0 2px" }} icon="info-sign" />
        </Tooltip>
        <strong style={{ marginLeft: 6 }}>
          {labelByType(currentChallengeType, items)}
        </strong>
      </Button>
    </ChallengeTypeSelect>
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ChallengeTypeMenu;
