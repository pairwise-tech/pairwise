import React from "react";
import { CHALLENGE_TYPE } from "@pairwise/common";
import { Button, ButtonGroup, Tooltip, Icon } from "@blueprintjs/core";
import { Select, ItemListRenderer, IListItemsProps } from "@blueprintjs/select";
import { getChallengeIcon } from "tools/utils";

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

const renderItemList: ItemListRenderer<ChallengeTypeOption> = ({
  renderItem,
  items,
}) => (
  <ButtonGroup style={{ minWidth: 150 }} fill alignText="left" vertical>
    {items.map(renderItem)}
  </ButtonGroup>
);

const labelByType = (
  type: string | undefined,
  items: ChallengeTypeOption[],
) => {
  const item = items.find(x => x.value === type);
  return item?.label || type;
};

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
      itemListRenderer={renderItemList}
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

export default ChallengeTypeMenu;
