import type { CSSProperties } from "react";

export class autoprefix {
  static vendor = {
    properties: [
      "animation",
      "animationDelay",
      "animationDirection",
      "animationDuration",
      "animationFillMode",
      "animationIterationCount",
      "animationName",
      "animationPlayState",
      "animationTimingFunction",
      "appearance",
      "backfaceVisibility",
      "backgroundClip",
      "borderImage",
      "borderImageSlice",
      "boxSizing",
      "boxShadow",
      "contentColumns",
      "transform",
      "transformOrigin",
      "transformStyle",
      "transition",
      "transitionDelay",
      "transitionDuration",
      "transitionProperty",
      "transitionTimingFunction",
      "perspective",
      "perspectiveOrigin",
      "userSelect",
    ],
    prefixes: ["Moz", "Webkit", "ms", "O"],
  };

  static prefixProp<Value>(key: string, value: Value) {
    return autoprefix.vendor.prefixes.reduce<{ [key: string]: Value }>(
      (obj, pre) => (
        (obj[pre + key[0]?.toUpperCase() + key.substring(1)] = value), obj
      ),
      {}
    );
  }

  static convert(style?: CSSProperties) {
    if (!style) return {};
    return Object.keys(style).reduce((obj, key) => {
      const value = style[key as keyof CSSProperties];
      return autoprefix.vendor.properties.includes(key)
        ? {
            ...obj,
            ...autoprefix.prefixProp(key, value),
          }
        : obj;
    }, style);
  }
}
