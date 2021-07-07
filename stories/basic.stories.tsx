import {Meta} from "@storybook/react";
import {useEffect, useRef, useState} from "react";
import {Form, Field, SubmitButton, FormValues} from "../src/index";
import {newAsyncValidator} from "../src/validation";

export default {title: "Basic"} as Meta;

function RenderCounter() {
    const renders = useRef(0);

    useEffect(() => {
        renders.current += 1;
    });

    return <span>Number of renders: {renders.current}</span>;
}

export function Basic() {
    return (
        <Form
            onFieldInteraction={(field) => console.log(`onFieldInteraction: ${JSON.stringify(field)}`)}
            onFieldValidation={(field) => console.log(`onFieldValidation: ${JSON.stringify(field)}`)}
            onFormValidationError={() => console.log(`onFormValidationError`)}
            onSubmit={(values) => console.log(`onSubmit: ${JSON.stringify(values)}`)}
        >
            <div>
                <FormValues>
                    {(values) => <pre style={{marginBottom: "16px"}}>{JSON.stringify(values)}</pre>}
                </FormValues>

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
                        <div style={{marginBottom: "16px"}}>
                            <div style={{display: "block", marginBottom: "8px"}}>
                                <RenderCounter />
                            </div>

                            <input
                                style={{display: "block", marginBottom: "8px"}}
                                value={props.value}
                                onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                                onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                            />

                            <span style={{display: "block", marginBottom: "8px"}}>State: {props.state}</span>
                            <span style={{display: "block"}}>
                                Message: {props.state === "error" || props.state === "warning" ? props.message : null}
                            </span>
                        </div>
                    )}
                </Field>

                <Field
                    initialValue=""
                    name="phone"
                    validators={[
                        newAsyncValidator(
                            (value) => new Promise((res) => setTimeout(() => res(value.length > 5), 5000)),
                            "error",
                            "This shit works..."
                        ),
                    ]}
                >
                    {(props) => (
                        <div style={{marginBottom: "16px"}}>
                            <div style={{display: "block", marginBottom: "8px"}}>
                                <RenderCounter />
                            </div>

                            <input
                                style={{display: "block", marginBottom: "8px"}}
                                value={props.value}
                                onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                                onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                            />

                            <span style={{display: "block", marginBottom: "8px"}}>State: {props.state}</span>
                            <span style={{display: "block"}}>
                                Message: {props.state === "error" || props.state === "warning" ? props.message : null}
                            </span>
                        </div>
                    )}
                </Field>

                <Field
                    initialValue=""
                    name="email"
                    meta={{trackValue: false}}
                    validators={[
                        newAsyncValidator(
                            (value) => new Promise((res) => setTimeout(() => res(value.length > 5), 5000)),
                            "error",
                            "This shit works..."
                        ),
                    ]}
                >
                    {(props) => (
                        <div style={{marginBottom: "16px"}}>
                            <div style={{display: "block", marginBottom: "8px"}}>
                                <RenderCounter />
                            </div>

                            <input
                                style={{display: "block", marginBottom: "8px"}}
                                value={props.value}
                                onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                                onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                            />

                            <span style={{display: "block", marginBottom: "8px"}}>State: {props.state}</span>
                            <span style={{display: "block"}}>
                                Message: {props.state === "error" || props.state === "warning" ? props.message : null}
                            </span>
                        </div>
                    )}
                </Field>
            </div>

            <SubmitButton>{(props) => <button disabled={props.state === "pending"}>Submit</button>}</SubmitButton>
        </Form>
    );
}
