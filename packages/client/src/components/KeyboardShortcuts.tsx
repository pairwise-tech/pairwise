import allPass from "ramda/es/allPass";
import React from "react";

const debug = require("debug")("client:KeyboardShortcuts");

type MetaKey = "shiftKey" | "ctrlKey" | "metaKey" | "altKey";

interface KeyboardShortcutsProps {
  keymap: { [k: string]: (e: KeyboardEvent) => any };
}

const KeyboardShortcuts = ({ keymap }: KeyboardShortcutsProps) => {
  React.useEffect(() => {
    const metaMap: { [k: string]: MetaKey } = {
      shift: "shiftKey",
      ctrl: "ctrlKey",
      alt: "altKey",
      option: "altKey",
      cmd: "metaKey",
      command: "metaKey",
    };

    const makePredicate = (commandString: string) => {
      const chars = commandString.split("+").map(x => x.toLowerCase());

      // Support mapping the escape key
      if (chars.length === 1 && chars[0] === "escape") {
        return (e: KeyboardEvent) => e.key.toLowerCase() === chars[0];
      }

      // If not the escape key then we require two mappings
      if (chars.length < 2) {
        console.warn("Keycode mappings must have at least 2 keys");
        return;
      }

      const charKey = chars[chars.length - 1]; // Last
      const charPred = (e: KeyboardEvent) => e.key.toLowerCase() === charKey;
      const meta = chars
        .slice(0, -1)
        .map(x => metaMap[x])
        .filter(Boolean);
      const metaPred = meta.map((k: MetaKey) => (e: KeyboardEvent) => e[k]);
      return allPass([...metaPred, charPred]);
    };

    const listeners = Object.keys(keymap).reduce(
      (agg: Array<(e: KeyboardEvent) => any>, commandString) => {
        const fn = keymap[commandString];
        const predicate = makePredicate(commandString);

        if (!predicate) {
          console.warn(
            `[INFO] Could not create key mapping for "${commandString}"`,
          );

          return agg;
        }

        return [...agg, (e: KeyboardEvent) => predicate(e) && fn(e)];
      },
      [],
    );

    debug("Setting up listeners");
    listeners.forEach(fn => {
      document.addEventListener("keydown", fn);
    });

    return () => {
      debug("Removing listeners");
      listeners.forEach(fn => {
        document.removeEventListener("keydown", fn);
      });
    };
  }, [keymap]);
  return null;
};

export default KeyboardShortcuts;
