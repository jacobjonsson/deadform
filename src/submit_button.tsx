import {FormEvent, ReactElement} from "react";
import {useDeadFormContext} from "./context";

interface SubmitButtonProps {
    handleSubmit: (event: FormEvent<HTMLButtonElement>) => void;
    state: "idle" | "pending";
}

interface SubmitButtonConfig {
    children: (props: SubmitButtonProps) => ReactElement;
}

export function SubmitButton(props: SubmitButtonConfig): ReactElement {
    const ctx = useDeadFormContext();

    return props.children({
        handleSubmit: (event: FormEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            event.preventDefault();
        },
        state: ctx.formState,
    });
}
