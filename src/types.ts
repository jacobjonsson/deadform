export type FieldState = "idle" | "pending" | "success" | "warning" | "error";

export type FieldValue = string;

export type FieldValidationOutcome =
    | {status: "success"}
    | {status: "warning"; message: string}
    | {status: "error"; message: string};

export type Field = {name: string; value: string} & (
    | {state: "success"; value: string}
    | {state: "pending"; value: string}
    | {state: "warning"; value: string; message: string}
    | {state: "error"; value: string; message: string}
);

export type FieldWithMeta = Field & {meta: Record<string, any>};
