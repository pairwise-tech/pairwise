import { Toaster, IconName, IToastProps } from "@blueprintjs/core";

/** ===========================================================================
 * Toaster Util
 * ============================================================================
 */

const BlueprintToaster = Toaster.create({ className: "blueprint-toaster" });

interface IToastOptions {
  icon?: IconName;
  timeout?: number;
}

// Create a util object which includes the Blueprint toaster and shortcut
// methods to quickly post success, failure, and warning toasts.
const toaster = {
  toast: BlueprintToaster,
  success: (message: string, options?: IToastOptions) => {
    return BlueprintToaster.show({
      message,
      intent: "success",
      icon: options?.icon || "tick",
      timeout: options?.timeout !== undefined ? options?.timeout : 5000,
    });
  },
  warn: (message: string, options?: IToastOptions) => {
    return BlueprintToaster.show({
      message,
      intent: "warning",
      icon: options?.icon || "warning-sign",
      timeout: options?.timeout !== undefined ? options?.timeout : 5000,
    });
  },
  error: (message: string, options?: IToastOptions) => {
    return BlueprintToaster.show({
      message,
      intent: "danger",
      icon: options?.icon || "error",
      timeout: options?.timeout !== undefined ? options?.timeout : 5000,
    });
  },
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default toaster;
