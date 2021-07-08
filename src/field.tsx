import {ReactElement, useEffect, useState} from "react";
import {useDeadFormContext} from "./context";
import {ValidatorEntity} from "./validation";

export type FieldProps = {changeValue: (value: string) => void; commitValue: (value: string) => void; value: string} & (
    | {state: "idle"}
    | {state: "pending"}
    | {state: "success"}
    | {state: "warning"; message: string}
    | {state: "error"; message: string}
);

export interface FieldConfig {
    children: (props: FieldProps) => ReactElement;
    name: string;
    initialValue?: string;
    validators?: Array<ValidatorEntity>;
    meta?: Record<string, any>;
}

export function Field(props: FieldConfig) {
    const {name, initialValue = "", validators = [], meta = {}, children} = props;
    const ctx = useDeadFormContext();
    const [localValue, setLocalVale] = useState(initialValue);

    useEffect(() => {
        ctx.registerField(name, localValue, validators, meta);
        return () => ctx.unregisterField(name);
    }, []);

    const message = ctx.getFieldMessage(name);
    const state = ctx.getFieldState(name);
    const changeValue = (value: string) => setLocalVale(value);
    const commitValue = (value: string) => ctx.commitValue(name, typeof value === "undefined" ? localValue : value);

    return children({
        changeValue,
        commitValue,
        value: localValue,
        state,
        ...(state === "error" || state === "warning" ? {message: message!} : {}),
    } as FieldProps);
}
