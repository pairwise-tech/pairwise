import React from "react";
import { Button } from "@blueprintjs/core";
import { Select, IListItemsProps } from "@blueprintjs/select";
import { FEEDBACK_TYPE } from "@pairwise/common";
import { getRenderItemList, labelByType } from "./SharedComponents";

const MENU_WIDTH = 195;

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
  intent: "danger" | "none";
}

const FeedbackTypeMenu = ({
  onItemSelect,
  currentFeedbackType,
  intent,
}: Props) => {
  return (
    <FeedbackTypeSelect
      filterable={false}
      onItemSelect={onItemSelect}
      items={FEEDBACK_TYPE_OPTIONS}
      itemListRenderer={getRenderItemList(MENU_WIDTH)}
      itemRenderer={(x, { handleClick, modifiers }) => (
        <Button
          fill={true}
          key={x.value}
          text={x.label}
          onClick={handleClick}
          active={modifiers.active}
        />
      )}
    >
      <Button
        intent={intent}
        alignText="left"
        aria-haspopup="true"
        rightIcon="caret-down"
        aria-controls="simple-menu"
        style={{ width: MENU_WIDTH }}
      >
        <strong>
          {!currentFeedbackType
            ? "Select Feedback Type"
            : labelByType(currentFeedbackType, FEEDBACK_TYPE_OPTIONS)}
        </strong>
      </Button>
    </FeedbackTypeSelect>
  );
};

export default FeedbackTypeMenu;
