import {ReactElement} from "react";
import {useDeadFormContext} from "./context";

interface FormValuesConfig {
    children: (values: Record<string, string | undefined>) => ReactElement;
}

export function FormValues(props: FormValuesConfig): ReactElement {
    const ctx = useDeadFormContext();

    return props.children(ctx.formValues);
}
