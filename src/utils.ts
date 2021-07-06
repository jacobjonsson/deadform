import {Field, FieldState} from "./types";

export function collectFields(
    values: Record<string, string | undefined>,
    states: Record<string, FieldState | undefined>,
    messages: Record<string, string | undefined>
): Record<string, Field> {
    let fields: Record<string, Field> = {};
    for (const name of Object.keys(values)) {
        fields[name] = {
            value: values[name],
            name: name,
            state: states[name],
            ...(states[name] === "error" || states[name] === "warning"
                ? {
                      message: messages[name],
                  }
                : {}),
        } as Field;
    }
    return fields;
}
