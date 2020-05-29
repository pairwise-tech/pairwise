import { Toaster, IconName } from "@blueprintjs/core";

/** ===========================================================================
 * Toaster Util
 * ============================================================================
 */

const BlueprintToaster = Toaster.create({ className: "blueprint-toaster" });

interface IToastOptions {
  icon?: IconName;
  timeout?: number;
  action?: { onClick: (args?: any) => void; text: string };
}

// Create a util object which includes the Blueprint toaster and shortcut
// methods to quickly post success, failure, and warning toasts.
const toaster = {
  toast: BlueprintToaster,
  success: (message: React.ReactNode, options?: IToastOptions) => {
    return BlueprintToaster.show({
      message,
      intent: "success",
      action: options?.action,
      icon: options?.icon || "tick",
      timeout: options?.timeout !== undefined ? options?.timeout : 5000,
    });
  },
  warn: (message: React.ReactNode, options?: IToastOptions) => {
    return BlueprintToaster.show({
      message,
      intent: "warning",
      action: options?.action,
      icon: options?.icon || "warning-sign",
      timeout: options?.timeout !== undefined ? options?.timeout : 5000,
    });
  },
  error: (message: React.ReactNode, options?: IToastOptions) => {
    return BlueprintToaster.show({
      message,
      intent: "danger",
      action: options?.action,
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
