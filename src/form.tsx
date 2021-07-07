import React, {useEffect, useReducer, useRef} from "react";
import {FormHTMLAttributes, ReactNode, useCallback, useMemo} from "react";
import {deadFormContext} from "./context";
import {Field, FieldState, FieldWithMeta} from "./types";
import {
    executeMixedValidation,
    executeSyncValidation,
    isAllSync,
    isSuccessful,
    SyncValidatorEntity,
    ValidatorEntity,
    ValidatorOutcome,
} from "./validation";
import {createEffectReference, EffectReference} from "./effect";
import {randomId} from "./id";
import {collectFields} from "./utils";

export interface FormState {
    status: "idle" | "pending";
    values: Record<string, string | undefined>;
    states: Record<string, FieldState | undefined>;
    messages: Record<string, string | undefined>;
    effects: Array<
        | EffectReference<"onFieldInteraction", Field>
        | EffectReference<"onFieldValidation", Field>
        | EffectReference<"onFormValidationError", Record<string, Field>>
        | EffectReference<"onSubmit", Record<string, string | undefined>>
    >;
}

type FormEvent =
    | {type: "register"; name: string; value: string}
    | {type: "unregister"; name: string}
    | {type: "commit_sync"; name: string; value: string; outcome: ValidatorOutcome}
    | {type: "commit_async"; name: string; value: string}
    | {type: "resolve_async_commit"; name: string; outcome: ValidatorOutcome}
    | {type: "submit_sync"; outcomes: Array<{name: string; outcome: ValidatorOutcome}>}
    | {type: "submit_async"}
    | {type: "resolve_async_submit"; outcomes: Array<{name: string; outcome: ValidatorOutcome}>};

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

                effects: [
                    ...state.effects,
                    createEffectReference("onFieldInteraction", {
                        name: event.name,
                        value: typeof event.value === "undefined" ? state.values[event.name] : event.value,
                        state: event.outcome.status,
                        ...(event.outcome.status !== "success" ? {message: event.outcome.message} : {}),
                    } as Field),
                    createEffectReference("onFieldValidation", {
                        name: event.name,
                        value: typeof event.value === "undefined" ? state.values[event.name] : event.value,
                        state: event.outcome.status,
                        ...(event.outcome.status !== "success" ? {message: event.outcome.message} : {}),
                    } as Field),
                ],
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
                effects: [
                    ...state.effects,
                    createEffectReference("onFieldInteraction", {
                        name: event.name,
                        value: typeof event.value === "undefined" ? state.values[event.name] : event.value,
                        state: "pending",
                    } as Field),
                ],
            };
        }

        case "resolve_async_commit": {
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
                effects: [
                    ...state.effects,
                    createEffectReference("onFieldValidation", {
                        name: event.name,
                        value: state.values[event.name],
                        state: event.outcome.status,
                        ...(event.outcome.status !== "success" ? {message: event.outcome.message} : {}),
                    } as Field),
                ],
            };
        }

        case "submit_sync": {
            const states = event.outcomes.reduce(
                (acc, curr) => ({
                    ...acc,
                    [curr.name]: curr.outcome.status,
                }),
                state.states
            );

            const messages = event.outcomes.reduce(
                (acc, curr) =>
                    curr.outcome.status === "success"
                        ? {...acc, [curr.name]: undefined}
                        : {...acc, [curr.name]: curr.outcome.message},
                state.messages
            );

            return {
                ...state,
                states,
                messages,
                effects: [
                    ...state.effects,
                    isSuccessful(event.outcomes.map((o) => o.outcome))
                        ? createEffectReference("onSubmit", state.values)
                        : createEffectReference(
                              "onFormValidationError",
                              collectFields(state.values, state.states, state.messages)
                          ),
                ],
            };
        }

        case "submit_async": {
            const states = Object.keys(state.states).reduce(
                (acc, curr) => ({
                    ...acc,
                    [curr]: "pending",
                }),
                {}
            );

            const messages = Object.keys(state.messages).reduce(
                (acc, curr) => ({
                    ...acc,
                    [curr]: undefined,
                }),
                {}
            );

            return {
                ...state,
                status: "pending",
                states,
                messages,
            };
        }

        case "resolve_async_submit": {
            const states = event.outcomes.reduce(
                (acc, curr) => ({
                    ...acc,
                    [curr.name]: curr.outcome.status,
                }),
                state.states
            );

            const messages = event.outcomes.reduce(
                (acc, curr) =>
                    curr.outcome.status === "success"
                        ? {...acc, [curr.name]: undefined}
                        : {...acc, [curr.name]: curr.outcome.message},
                state.messages
            );

            return {
                ...state,
                status: "idle",
                states,
                messages,
                effects: [
                    ...state.effects,
                    isSuccessful(event.outcomes.map((o) => o.outcome))
                        ? createEffectReference("onSubmit", state.values)
                        : createEffectReference(
                              "onFormValidationError",
                              collectFields(state.values, state.states, state.values)
                          ),
                ],
            };
        }

        default: {
            return state;
        }
    }
}

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
    children: ReactNode;
    /**
     * Called after the form has been submitted and validation passed.
     */
    onSubmit: (values: Record<string, string | undefined>) => void;
    /**
     * Called after the form has been submitted but validation did not pass.
     */
    onFormValidationError?: (fields: Record<string, Field>) => void;
    /**
     * Called after commit
     */
    onFieldInteraction?: (field: FieldWithMeta) => void;
    /**
     * Called after a field has been validated
     */
    onFieldValidation?: (field: FieldWithMeta) => void;
}

export function Form(props: FormProps) {
    const {children, onSubmit, onFieldInteraction, onFieldValidation, onFormValidationError, ...rest} = props;

    const validatorEntities = useRef<Record<string, Array<ValidatorEntity> | undefined>>({});
    const fieldMetas = useRef<Record<string, Record<string, any>>>({});
    const cancelationRefs = useRef<Record<string, string | undefined>>({});
    const submitCancelationRef = useRef<string | undefined>(undefined);

    const [state, dispatch] = useReducer(reducer, {
        status: "idle",
        values: {},
        states: {},
        messages: {},
        effects: [],
    });

    useEffect(() => {
        for (const effect of state.effects) {
            if (effect.executed) {
                continue;
            }

            effect.executed = true;

            switch (effect.reference) {
                case "onFieldInteraction": {
                    if (onFieldInteraction) {
                        onFieldInteraction({...effect.payload, meta: fieldMetas.current[effect.payload.name]});
                    }
                    break;
                }
                case "onFieldValidation": {
                    if (onFieldValidation) {
                        onFieldValidation({...effect.payload, meta: fieldMetas.current[effect.payload.name]});
                    }
                    break;
                }
                case "onFormValidationError": {
                    if (onFormValidationError) {
                        onFormValidationError(effect.payload);
                    }
                    break;
                }
                case "onSubmit": {
                    if (onSubmit) {
                        onSubmit(effect.payload);
                    }
                    break;
                }
            }
        }
    }, [state.effects, onFieldInteraction, onFieldValidation, onSubmit, onFormValidationError]);

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
                const outcome = executeSyncValidation(validators, value, {...state.values, [name]: value});
                dispatch({type: "commit_sync", name, value, outcome});
                return;
            }

            const cancelationRef = randomId();
            cancelationRefs.current[name] = cancelationRef;
            dispatch({type: "commit_async", name, value});
            executeMixedValidation(validators, value, {...state.values, [name]: value}).then((outcome) => {
                if (cancelationRefs.current[name] === cancelationRef) {
                    dispatch({type: "resolve_async_commit", name, outcome});
                    delete cancelationRefs.current[name];
                }
            });
        },
        [state.values]
    );

    const registerField = useCallback(
        (name: string, value: string, validators: Array<ValidatorEntity>, meta: Record<string, string>) => {
            dispatch({type: "register", name, value});

            validatorEntities.current[name] = validators;
            fieldMetas.current[name] = meta;
        },
        []
    );

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
            formState: state.status,
            formValues: state.values,
        }),
        [
            getFieldValue,
            getFieldState,
            getFieldMessage,
            commitValue,
            registerField,
            unregisterField,
            state.status,
            state.values,
        ]
    );

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        event.stopPropagation();

        // Cancel all of the currently pending async validations
        for (const key of Object.keys(cancelationRefs.current)) {
            cancelationRefs.current[key] = randomId();
        }

        const submitRef = randomId();
        submitCancelationRef.current = submitRef;

        if (Object.values(validatorEntities.current).every((v) => typeof v === "undefined" || isAllSync(v))) {
            const outcomes: Array<{name: string; outcome: ValidatorOutcome}> = [];
            for (const [name, value] of Object.entries(state.values)) {
                const entities = validatorEntities.current[name] as Array<SyncValidatorEntity>;
                if (!validatorEntities) {
                    outcomes.push({name, outcome: {status: "success"}});
                    continue;
                }

                const outcome = executeSyncValidation(entities!, value!, state.values);
                outcomes.push({name, outcome});
            }
            dispatch({type: "submit_sync", outcomes});

            return;
        }

        dispatch({type: "submit_async"});

        const outcomes: Array<Promise<{name: string; outcome: ValidatorOutcome}>> = [];
        for (const [name, value] of Object.entries(state.values)) {
            const entities = validatorEntities.current[name];
            if (!validatorEntities) {
                outcomes.push(Promise.resolve({name, outcome: {status: "success"}}));
                continue;
            }

            const outcome = executeMixedValidation(entities!, value!, state.values).then((outcome) => ({
                name,
                outcome,
            }));
            outcomes.push(outcome);
        }
        Promise.all(outcomes).then((outcomes) => {
            if (submitCancelationRef.current === submitRef) {
                dispatch({type: "resolve_async_submit", outcomes});
            }
        });
    }

    return (
        <deadFormContext.Provider value={formValue}>
            <form {...rest} onSubmit={handleSubmit}>
                {children}
            </form>
        </deadFormContext.Provider>
    );
}
