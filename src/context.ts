import {createContext, useContext} from "react";
import {FieldFormatter, FieldState} from "./types";
import {ValidatorEntity} from "./validation";

export interface RegisterFieldProps {
    name: string;
    value: string;
    validators: Array<ValidatorEntity>;
    formatter: FieldFormatter;
    meta: Record<string, any>;
}

export interface DeadFormContext {
    formState: "idle" | "pending";
    formValues: Record<string, string | undefined>;
    getFieldValue: (name: string) => string | undefined;
    getFieldMessage: (name: string) => string | undefined;
    getFieldState: (name: string) => FieldState | undefined;
    commitValue: (name: string, value?: string) => void;
    registerField: (props: RegisterFieldProps) => void;
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
