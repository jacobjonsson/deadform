import {Meta} from "@storybook/react";
import {Form, Field} from "../src/index";
import {newAsyncValidator} from "../src/validation";

export default {title: "Basic"} as Meta;

export function Basic() {
    return (
        <Form
            onFieldInteraction={(field) => console.log(`onFieldInteraction: ${JSON.stringify(field)}`)}
            onFieldValidation={(field) => console.log(`onFieldValidation: ${JSON.stringify(field)}`)}
            onFormValidationError={() => console.log(`onFormValidationError`)}
            onSubmit={(values) => console.log(`onSubmit: ${JSON.stringify(values)}`)}
        >
            <div style={{display: "grid", gridTemplateColumns: "auto auto auto auto"}}>
                <Field
                    initialValue=""
                    name="name"
                    validators={[
                        newAsyncValidator(
                            (value) => new Promise((res) => setTimeout(() => res(value.length > 5), 5000)),
                            "error",
                            "This shit works..."
                        ),
                    ]}
                >
                    {(props) => (
                        <div style={{padding: "8px"}}>
                            <input
                                style={{display: "block"}}
                                value={props.value}
                                onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                                onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                            />

                            <span style={{display: "block"}}>State: {props.state}</span>
                            <span style={{display: "block"}}>
                                Message: {props.state === "error" || props.state === "warning" ? props.message : null}
                            </span>
                        </div>
                    )}
                </Field>
            </div>

            <button>Submit</button>
        </Form>
    );
}
