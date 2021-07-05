import {Meta} from "@storybook/react";
import {Fragment} from "react";
import {Form, Field} from "../src/index";
import {newAsyncValidator, newSyncValidator} from "../src/validation";

export default {title: "Basic"} as Meta;

export const Basic = () => (
    <Form onSubmit={values => alert(JSON.stringify(values))}>
        <div style={{display: "grid", gridTemplateColumns: "auto auto auto auto"}}>
            {Array.from(Array(1000).keys()).map(idx => (
                <Field
                    initialValue=""
                    name={`field-${idx}`}
                    key={idx}
                    validators={[
                        newAsyncValidator(
                            () => new Promise(res => setTimeout(() => res(false), 3000)),
                            "error",
                            "This shit works..."
                        ),
                    ]}
                >
                    {props => (
                        <div style={{padding: "8px"}}>
                            <input
                                style={{display: "block"}}
                                placeholder={`Field ${idx}`}
                                value={props.value}
                                onChange={evt => props.changeValue(evt.currentTarget.value)}
                                onBlur={evt => props.commitValue(evt.currentTarget.value)}
                            />

                            <span style={{display: "block"}}>State: {props.state}</span>
                            <span style={{display: "block"}}>
                                Message: {props.state === "error" || props.state === "warning" ? props.message : null}
                            </span>
                        </div>
                    )}
                </Field>
            ))}
        </div>

        <button>Submit</button>
    </Form>
);
