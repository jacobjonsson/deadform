export type ValidatorOutcome =
    | {status: "success"}
    | {status: "warning"; message: string}
    | {status: "error"; message: string};

export type SyncValidationFn = (value: string, values: Record<string, string | undefined>) => boolean;
export type SyncValidator = (value: string, values: Record<string, string | undefined>) => ValidatorOutcome;
export type SyncValidatorEntity = {type: "sync"; fn: SyncValidator};

export type AsyncValidationFn = (value: string, values: Record<string, string | undefined>) => Promise<boolean>;
export type AsyncValidator = (value: string, values: Record<string, string | undefined>) => Promise<ValidatorOutcome>;
export type AsyncValidatorEntity = {type: "async"; fn: AsyncValidator};

export type ValidatorEntity = SyncValidatorEntity | AsyncValidatorEntity;

export function newSyncValidator(
    fn: SyncValidationFn,
    severity: "warning" | "error",
    message: string
): SyncValidatorEntity {
    return {
        type: "sync",
        fn(value, values) {
            const res = fn(value, values);
            if (res) {
                return {status: "success"};
            }

            return {status: severity, message};
        },
    };
}

export function newAsyncValidator(
    fn: AsyncValidationFn,
    severity: "warning" | "error",
    message: string
): AsyncValidatorEntity {
    return {
        type: "async",
        fn(value, values) {
            return fn(value, values)
                .then((res) => {
                    if (res) {
                        return {status: "success"} as const;
                    }

                    return {status: severity, message};
                })
                .catch(() => {
                    return {status: severity, message};
                });
        },
    };
}

export function isAllSync(entities: Array<ValidatorEntity>): entities is Array<SyncValidatorEntity> {
    return entities.every((e) => e.type === "sync");
}

export function isAllAsync(entities: Array<ValidatorEntity>): entities is Array<AsyncValidatorEntity> {
    return entities.every((e) => e.type === "async");
}

export function executeSyncValidation(
    entities: Array<SyncValidatorEntity>,
    value: string,
    values: Record<string, string | undefined>
): ValidatorOutcome {
    for (const entity of entities) {
        let outcome = entity.fn(value, values);
        if (outcome.status === "error") {
            return outcome;
        }
    }

    return {status: "success"};
}

export async function executeAsyncValidation(
    entities: Array<AsyncValidatorEntity>,
    value: string,
    values: Record<string, string | undefined>
): Promise<ValidatorOutcome> {
    for (const entity of entities) {
        let outcome = await entity.fn(value, values);
        if (outcome.status === "error") {
            return outcome;
        }
    }

    return {status: "success"};
}

export async function executeMixedValidation(
    entities: Array<ValidatorEntity>,
    value: string,
    values: Record<string, string | undefined>
): Promise<ValidatorOutcome> {
    for (const entity of entities) {
        let outcome;
        if (entity.type === "sync") {
            outcome = entity.fn(value, values);
        } else {
            outcome = await entity.fn(value, values);
        }
        if (outcome.status === "error") {
            return outcome;
        }
    }

    return {status: "success"};
}

export function isSuccessful(outcomes: Array<ValidatorOutcome>): boolean {
    return outcomes.every((o) => o.status === "success");
}

export function hasError(outcomes: Array<ValidatorOutcome>): boolean {
    return outcomes.some((o) => o.status === "error");
}

export function hasWarning(outcomes: Array<ValidatorOutcome>): boolean {
    return outcomes.some((o) => o.status === "warning");
}
