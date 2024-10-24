import { ScriptModel } from "crdt/node/load-script-models";
import { JSXElement, JSXElementName } from "utils/script/parser/oxc-types";
import { SingleExportVar } from "./parse-item-types";
import { cutCode } from "utils/script/jscript";

export const parseItemPassProp = ({
  name,
  node,
  model,
  replacements,
  exports,
}: {
  name: JSXElementName;
  node: JSXElement;
  model: ScriptModel;
  replacements: Array<{
    start: number;
    end: number;
    replacement: string;
  }>;
  exports: Record<string, SingleExportVar>;
}) => {
  if (name.type === "JSXIdentifier") {
    if (name.name === "PassProp") {
      for (const attr of node.openingElement.attributes) {
        if (
          attr.type === "JSXAttribute" &&
          attr.name.type === "JSXIdentifier" &&
          attr.value
        ) {
          const prop_name = attr.name.name;

          let value = "any";
          let expr: any = attr.value;
          if (attr.value.type === "JSXExpressionContainer") {
            expr = attr.value.expression;
          }
          if (expr.type === "StringLiteral") {
            value = "string";
          } else if (expr.type === "BooleanLiteral") {
            value = "boolean";
          } else if (expr.type === "NumericLiteral") {
            value = "number";
          } else if (expr.type === "TSAsExpression") {
            value = cutCode(model.source, expr.typeAnnotation, -2);
          }

          if (prop_name !== "key") {
            exports[prop_name] = {
              type: "passprop",
              name: prop_name,
              value,
            };
          }
        }
      }
    }
  }
};
