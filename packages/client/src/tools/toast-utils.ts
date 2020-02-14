import { Toaster, IconName } from "@blueprintjs/core";

/** ===========================================================================
 * Toaster Utils
 * ============================================================================
 */

const BlueprintToaster = Toaster.create({ className: "blueprint-toaster" });

// Create a util object which includes the Blueprint toaster and shortcut
// methods to quickly post success, failure, and warning toasts.
const toaster = {
  toast: BlueprintToaster,
  success: (message: string, icon?: IconName) => {
    return BlueprintToaster.show({
      message,
      intent: "success",
      icon: icon || "tick",
    });
  },
  warn: (message: string, icon?: IconName) => {
    return BlueprintToaster.show({
      message,
      intent: "warning",
      icon: icon || "warning-sign",
    });
  },
  error: (message: string, icon?: IconName) => {
    return BlueprintToaster.show({
      message,
      intent: "danger",
      icon: icon || "error",
    });
  },
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default toaster;
