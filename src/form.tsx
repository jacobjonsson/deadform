import React, {useReducer, useRef} from "react";
import {FormHTMLAttributes, ReactNode, useCallback, useMemo} from "react";
import {deadFormContext} from "./context";
import {FieldState} from "./types";
import {
    executeAsyncValidation,
    executeMixedValidation,
    executeSyncValidation,
    isAllAsync,
    isAllSync,
    ValidatorEntity,
    ValidatorOutcome,
} from "./validation";

export interface FormState {
    values: Record<string, string | undefined>;
    states: Record<string, FieldState | undefined>;
    messages: Record<string, string | undefined>;
}

type FormEvent =
    | {type: "register"; name: string; value: string}
    | {type: "unregister"; name: string}
    | {type: "commit_sync"; name: string; value: string; outcome: ValidatorOutcome}
    | {type: "commit_async"; name: string; value: string}
    | {type: "resolve_async"; name: string; outcome: ValidatorOutcome}
    | {type: "submit"};

function reducer(state: FormState, event: FormEvent): FormState {
    switch (event.type) {
        case "register": {
            return {
                ...state,
                values: {
                    ...state.values,
                    [event.name]: event.value,
                },
                states: {
                    ...state.states,
                    [event.name]: "idle",
                },
                messages: {
                    ...state.states,
                    [event.name]: undefined,
                },
            };
        }

        case "unregister": {
            delete state.values[event.name];
            delete state.states[event.name];
            delete state.messages[event.name];
            return state;
        }

        case "commit_sync": {
            return {
                ...state,
                values: {
                    ...state.values,
                    [event.name]: typeof event.value === "undefined" ? state.values[event.name] : event.value,
                },
                states: {
                    ...state.states,
                    [event.name]: event.outcome.status,
                },
                messages:
                    event.outcome.status !== "success"
                        ? {
                              ...state.messages,
                              [event.name]: event.outcome.message,
                          }
                        : {
                              ...state.messages,
                              [event.name]: undefined,
                          },
            };
        }

        case "commit_async": {
            return {
                ...state,
                values: {
                    ...state.values,
                    [event.name]: typeof event.value === "undefined" ? state.values[event.name] : event.value,
                },
                states: {
                    ...state.states,
                    [event.name]: "pending",
                },
                messages: {
                    ...state.messages,
                    [event.name]: undefined,
                },
            };
        }

        case "resolve_async": {
            return {
                ...state,
                states: {
                    ...state.states,
                    [event.name]: event.outcome.status,
                },
                messages:
                    event.outcome.status !== "success"
                        ? {
                              ...state.messages,
                              [event.name]: event.outcome.message,
                          }
                        : {
                              ...state.messages,
                              [event.name]: undefined,
                          },
            };
        }

        case "submit": {
            return state;
        }

        default: {
            return state;
        }
    }
}

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
    children: ReactNode;
    onSubmit: (values: Record<string, string | undefined>) => void;
}

export function Form(props: FormProps) {
    const {children, onSubmit, ...rest} = props;

    const validatorEntities = useRef<Record<string, Array<ValidatorEntity> | undefined>>({});

    const [state, dispatch] = useReducer(reducer, {
        values: {},
        states: {},
        messages: {},
    });

    const getFieldValue = useCallback(
        (name: string) => {
            return state.values[name];
        },
        [state.values]
    );

    const getFieldState = useCallback(
        (name: string) => {
            return state.states[name] || "idle";
        },
        [state.states]
    );

    const getFieldMessage = useCallback(
        (name: string) => {
            return state.messages[name];
        },
        [state.messages]
    );

    const commitValue = useCallback(
        (name: string, newValue?: string) => {
            const value = typeof newValue === "undefined" ? state.values[name] : newValue;
            const validators = validatorEntities.current[name];
            if (typeof validators === "undefined" || typeof value === "undefined") {
                throw new Error(`${name} hasn't been initialized. This is an internal error in deadform`);
            }

            if (validators.length === 0) {
                dispatch({type: "commit_sync", name, value, outcome: {status: "success"}});
                return;
            }

            if (isAllSync(validators)) {
                const outcome = executeSyncValidation(validators, value, state.values);
                dispatch({type: "commit_sync", name, value, outcome});
                return;
            }

            if (isAllAsync(validators)) {
                dispatch({type: "commit_async", name, value});
                executeAsyncValidation(validators, value, state.values).then(outcome => {
                    dispatch({type: "resolve_async", name, outcome});
                });
                return;
            }

            dispatch({type: "commit_async", name, value});
            executeMixedValidation(validators, value, state.values).then(outcome => {
                dispatch({type: "resolve_async", name, outcome});
            });
        },
        [state.values]
    );

    const registerField = useCallback((name: string, value: string, validators: Array<ValidatorEntity>) => {
        dispatch({type: "register", name, value});

        validatorEntities.current[name] = validators;
    }, []);

    const unregisterField = useCallback((name: string) => {
        dispatch({type: "unregister", name});
    }, []);

    const formValue = useMemo(
        () => ({
            getFieldValue,
            getFieldState,
            getFieldMessage,
            commitValue,
            registerField,
            unregisterField,
        }),
        [getFieldValue, getFieldState, getFieldMessage, commitValue, registerField, unregisterField]
    );

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        event.stopPropagation();
        props.onSubmit(state.values);
    }

    return (
        <deadFormContext.Provider value={formValue}>
            <form {...rest} onSubmit={handleSubmit}>
                {children}
            </form>
        </deadFormContext.Provider>
    );
}
