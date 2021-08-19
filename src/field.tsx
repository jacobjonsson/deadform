import {ReactElement, useEffect, useState} from "react";
import {useDeadFormContext} from "./context";
import {ValidatorEntity} from "./validation";
import {identity} from "./identity";

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
    formatter?: (value: string) => string;
}

export function Field(props: FieldConfig) {
    const {name, initialValue = "", validators = [], meta = {}, formatter = identity, children} = props;
    const ctx = useDeadFormContext();
    const [localValue, setLocalVale] = useState(initialValue);

    useEffect(() => {
        if (typeof ctx.formValues[name] === "string") {
            setLocalVale(ctx.formValues[name] as string);
        }
    }, [ctx.formValues[name]]);

    useEffect(() => {
        ctx.registerField({name, formatter, validators, meta, value: localValue});
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
