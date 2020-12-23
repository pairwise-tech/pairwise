import Swipy from "swipyjs";
import React from "react";
import Modules from "modules/root";
import { MOBILE_SCROLL_PANEL_ID } from "./Workspace";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface NavigationSwipeHandlerProps {
  isMobile: boolean;
  overlayVisible: boolean;
  setNavigationMapState: typeof Modules.actions.challenges.setNavigationMapState;
}

/** ===========================================================================
 * Component
 * ---------------------------------------------------------------------------
 * The navigation swipe handler component which handles detecting swipe
 * events on mobile and toggling the navigation side menu.
 * ============================================================================
 */

const NavigationSwipeHandler = (props: NavigationSwipeHandlerProps) => {
  const { isMobile, overlayVisible, setNavigationMapState } = props;

  /**
   * Determine if a touch event came the code panel scroll area.
   *
   * NOTE: Safari has lacking compatibility for TouchEvents so in Safari we
   * recursively walk backwards up the DOM tree looking for the mobile
   * scroll panel element by its id.
   */
  const isTouchEventOnEditor = (touchEvent: any) => {
    try {
      // For most browsers:
      if (touchEvent.path) {
        return !!touchEvent.path.find(
          (x: HTMLElement) => x.id === MOBILE_SCROLL_PANEL_ID,
        );
      } else {
        // For Safari:
        let node = touchEvent.srcElement.parentNode;
        // document.parentNode is null so this should terminate eventually
        while (node) {
          if (node.id === MOBILE_SCROLL_PANEL_ID) {
            return true;
          } else {
            node = node.parentNode;
          }
        }
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  /**
   * Add a gesture handler to toggle the navigation menu.
   */
  React.useEffect(() => {
    // Not available on desktop
    if (!isMobile) {
      return;
    }

    // Attach handler to the document
    const swipeHandler = new Swipy(document.documentElement);

    // Handle to swipe right
    swipeHandler.on("swiperight", (touchEvent: any) => {
      if (isTouchEventOnEditor(touchEvent)) {
        return;
      }

      if (!overlayVisible) {
        setNavigationMapState(true);
      }
    });

    // Handle to swipe left
    swipeHandler.on("swipeleft", (touchEvent: any) => {
      if (isTouchEventOnEditor(touchEvent)) {
        return;
      }

      if (overlayVisible) {
        setNavigationMapState(false);
      }
    });

    // Remove native event listeners on unmount
    return () => {
      swipeHandler.unbind();
    };
  });

  return null;
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default NavigationSwipeHandler;
