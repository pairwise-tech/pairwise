import React from "react";
import { Button } from "@blueprintjs/core";
import { Select, IListItemsProps } from "@blueprintjs/select";
import { FEEDBACK_TYPE } from "@pairwise/common";
import { getRenderItemList, labelByType } from "./Shared";

const MENU_WIDTH = 190;

interface FeedbackTypeOption {
  value: FEEDBACK_TYPE;
  label: string;
}

const FEEDBACK_TYPE_OPTIONS: FeedbackTypeOption[] = [
  { value: "TOO_HARD", label: "Too Hard" },
  { value: "TOO_EASY", label: "Too Easy" },
  { value: "NOT_HELPFUL", label: "Not Helpful" },
  { value: "OTHER", label: "Other" },
];

const FeedbackTypeSelect = Select.ofType<FeedbackTypeOption>();

interface Props {
  onItemSelect: IListItemsProps<FeedbackTypeOption>["onItemSelect"];
  currentFeedbackType: Nullable<string>;
}

const FeedbackTypeMenu = ({ onItemSelect, currentFeedbackType }: Props) => {
  return (
    <FeedbackTypeSelect
      filterable={false}
      onItemSelect={onItemSelect}
      items={FEEDBACK_TYPE_OPTIONS}
      itemListRenderer={getRenderItemList(MENU_WIDTH)}
      itemRenderer={(x, { handleClick, modifiers }) => (
        <Button
          key={x.value}
          text={x.label}
          onClick={handleClick}
          active={modifiers.active}
        />
      )}
    >
      <Button
        style={{ width: MENU_WIDTH }}
        alignText="left"
        fill={true}
        rightIcon="caret-down"
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        {!currentFeedbackType
          ? "Select Feedback Type"
          : labelByType(currentFeedbackType, FEEDBACK_TYPE_OPTIONS)}
      </Button>
    </FeedbackTypeSelect>
  );
};

export default FeedbackTypeMenu;
