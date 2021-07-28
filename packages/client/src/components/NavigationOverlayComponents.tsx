import {
  CourseSkeleton,
  ModuleSkeleton,
  ModuleSkeletonList,
  ChallengeSkeleton,
  ChallengeSkeletonList,
} from "@pairwise/common";
import Modules from "modules/root";
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
} from "react-sortable-hoc";
import React from "react";
import CodepressNavigationContextMenu from "./CodepressContextMenu";
import styled from "styled-components/macro";
import { COLORS } from "tools/constants";
import { defaultTextColor, IThemeProps } from "./ThemeContainer";

/** ===========================================================================
 * Sortable Module List
 * ============================================================================
 */

interface SortableModuleContainerProps {
  isEditMode: boolean;
  course: CourseSkeleton;
  currentActiveModule: ModuleSkeleton;
  updateCourseModule: typeof Modules.actions.challenges.updateCourseModule;
  handleDeleteModule: (moduleId: string) => void;
  renderModuleNavigationItem: (
    activeModuleId: string,
    module: ModuleSkeleton,
    index: number,
  ) => JSX.Element;
  renderModuleCodepressButton: (
    course: CourseSkeleton,
    index: number,
  ) => JSX.Element;
}

interface SortableModuleItemValue extends SortableModuleContainerProps {
  index: number;
  module: ModuleSkeleton;
}

export const SortableModuleList = SortableContainer(
  ({
    items: modules,
    itemValueProps,
  }: {
    items: ModuleSkeletonList;
    itemValueProps: SortableModuleContainerProps;
  }) => {
    return (
      <UnorderedList>
        {modules.map((m: ModuleSkeleton, index: number) => {
          return (
            <SortableModuleItem
              key={m.id}
              index={index}
              value={{ module: m, index, ...itemValueProps }}
            />
          );
        })}
      </UnorderedList>
    );
  },
);

const SortableModuleItem = SortableElement(
  (props: { value: SortableModuleItemValue }) => {
    const {
      index,
      module,
      course,
      isEditMode,
      handleDeleteModule,
      currentActiveModule,
      updateCourseModule,
      renderModuleNavigationItem,
      renderModuleCodepressButton,
    } = props.value;

    const DraggableModuleHandle = SortableHandle(() => (
      <ModuleNumber>{index}</ModuleNumber>
    ));

    return (
      <UnorderedListItem>
        <div key={module.id} style={{ position: "relative" }}>
          {isEditMode ? (
            <CodepressNavigationContextMenu
              type="MODULE"
              handleDelete={() => handleDeleteModule(module.id)}
            >
              <ModuleNavigationBase
                active={currentActiveModule.id === module.id}
              >
                <span>
                  <DraggableModuleHandle />
                  <NavUpdateField
                    value={module.title}
                    onChange={(e) => {
                      updateCourseModule({
                        id: module.id,
                        courseId: course.id,
                        module: { title: e.target.value },
                      });
                    }}
                  />
                </span>
              </ModuleNavigationBase>
            </CodepressNavigationContextMenu>
          ) : (
            renderModuleNavigationItem(module.id, module, index)
          )}
          {renderModuleCodepressButton(course, index)}
        </div>
      </UnorderedListItem>
    );
  },
);

/** ===========================================================================
 * Sortable Challenge List
 * ============================================================================
 */

interface SortableChallengeContainerProps {
  isEditMode: boolean;
  course: CourseSkeleton;
  module: ModuleSkeleton;
  renderChallengeNavigationItem: (args: {
    index: number;
    section?: boolean;
    module: ModuleSkeleton;
    course: CourseSkeleton;
    challenge: ChallengeSkeleton;
  }) => JSX.Element;
  deleteChallenge: typeof Modules.actions.challenges.deleteChallenge;
}

interface SortableChallengeItemValue extends SortableChallengeContainerProps {
  index: number;
  challenge: ChallengeSkeleton;
}

const SortableChallengeItem = SortableElement(
  (props: { value: SortableChallengeItemValue }) => {
    const {
      index,
      course,
      module,
      challenge,
      isEditMode,
      deleteChallenge,
      renderChallengeNavigationItem,
    } = props.value;

    if (isEditMode) {
      return (
        <UnorderedListItem>
          <CodepressNavigationContextMenu
            type="CHALLENGE"
            handleDelete={() =>
              deleteChallenge({
                courseId: course.id,
                moduleId: module.id,
                challengeId: challenge.id,
              })
            }
          >
            {renderChallengeNavigationItem({
              module,
              course,
              challenge,
              index,
            })}
          </CodepressNavigationContextMenu>
        </UnorderedListItem>
      );
    } else {
      return (
        <UnorderedListItem>
          {renderChallengeNavigationItem({ module, course, challenge, index })}
        </UnorderedListItem>
      );
    }
  },
);

export const SortableChallengeList = SortableContainer(
  ({
    items: challenges,
    itemValueProps,
  }: {
    items: ChallengeSkeletonList;
    itemValueProps: SortableChallengeContainerProps;
  }) => {
    return (
      <UnorderedList>
        {challenges.map((challenge: ChallengeSkeleton, index: number) => {
          return (
            <SortableChallengeItem
              index={index}
              key={challenge.id}
              value={{ challenge, index, ...itemValueProps }}
            />
          );
        })}
      </UnorderedList>
    );
  },
);

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const UnorderedList = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;
`;

const UnorderedListItem = styled.li`
  margin: 0;
  padding: 0;
`;

const NavUpdateField = styled.input`
  padding: 0;
  font-size: 18px;
  border: 1px solid transparent;
  border-bottom-color: ${(props: IThemeProps) => {
    return props.theme.dark ? COLORS.LIGHT_GREY : COLORS.NAV_LIGHT_BORDER;
  }};

  width: 100%;
  display: block;
  text-align: left;
  outline: none;
  background: transparent;
  position: relative;

  ${defaultTextColor};

  &:hover,
  &:focus {
    ${defaultTextColor};
    background: #0d0d0d;
  }
`;

export const ModuleNumber = styled.code`
  font-size: 12px;
  display: inline-block;
  padding: 5px;
  color: #ea709c;
  background: #3a3a3a;
  width: 24px;
  text-align: center;
  line-height: 12px;
  border-radius: 4px;
  box-shadow: inset 0px 0px 2px 0px #ababab;
  margin-right: 8px;
`;

export const ModuleNavigationBase = styled.div<{ active?: boolean }>`
  cursor: pointer;
  padding-left: 12px;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-right: 2px;
  font-size: 18px;
  border: 1px solid transparent;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  position: relative;

  border-bottom-color: ${(props: IThemeProps) => {
    return props.theme.dark ? COLORS.LIGHT_GREY : COLORS.NAV_LIGHT_BORDER;
  }};

  span {
    display: flex;
    align-items: center;
  }

  &:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    transition: all 0.15s ease-out;
    transform: scale(${({ active }) => (active ? 1 : 0)});
    width: 3px;
    background: ${COLORS.GRADIENT_GREEN};
  }
`;
