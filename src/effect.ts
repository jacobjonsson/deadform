export class EffectReference<R, P> {
    private _reference: R;
    private _executed: boolean;
    private _payload: P;

    constructor(reference: R, payload: P) {
        this._reference = reference;
        this._executed = false;
        this._payload = payload;
    }

    get reference() {
        return this._reference;
    }

    get payload() {
        return this._payload;
    }

    get executed() {
        return this._executed;
    }

    set executed(executed: boolean) {
        this._executed = executed;
    }
}

export function createEffectReference<R, P>(reference: R, payload: P): EffectReference<R, P> {
    return new EffectReference(reference, payload);
}
