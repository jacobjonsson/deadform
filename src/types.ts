export type FieldState = "idle" | "pending" | "success" | "warning" | "error";

export type FieldValue = string;

export type FieldValidationOutcome =
    | {status: "success"}
    | {status: "warning"; message: string}
    | {status: "error"; message: string};

export interface InternalField {
    state: FieldState;
    message?: string;
    value: string;
}
