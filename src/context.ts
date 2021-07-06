import {createContext, useContext} from "react";
import {FieldState} from "./types";
import {ValidatorEntity} from "./validation";

export interface DeadFormContext {
    formState: "idle" | "pending";
    formValues: Record<string, string | undefined>;
    getFieldValue: (name: string) => string | undefined;
    getFieldMessage: (name: string) => string | undefined;
    getFieldState: (name: string) => FieldState | undefined;
    commitValue: (name: string, value?: string) => void;
    registerField: (name: string, value: string, validators: Array<ValidatorEntity>) => void;
    unregisterField: (name: string) => void;
}

export const deadFormContext = createContext<DeadFormContext>({
    formState: "idle",
    formValues: {},
    getFieldValue: () => "",
    getFieldMessage: () => undefined,
    getFieldState: () => "idle",
    commitValue: () => undefined,
    registerField: () => undefined,
    unregisterField: () => undefined,
});

export function useDeadFormContext() {
    return useContext(deadFormContext);
}
