import React, {Fragment} from "react";
import {fireEvent, render, screen, act} from "@testing-library/react";
import {Form, Field, newSyncValidator, newAsyncValidator} from "../src";

const noop = () => undefined;

test("should handle change value", () => {
    const handleSubmit = jest.fn();

    render(
        <Form onSubmit={handleSubmit}>
            <Field name="name" initialValue="">
                {(props) => (
                    <input
                        placeholder="Enter name"
                        value={props.value}
                        onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                        onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                    />
                )}
            </Field>

            <button>Submit</button>
        </Form>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter name"), {target: {value: "lendo"}});
    expect((screen.getByPlaceholderText("Enter name") as HTMLInputElement).value).toEqual("lendo");
    fireEvent.blur(screen.getByPlaceholderText("Enter name"));
    expect((screen.getByPlaceholderText("Enter name") as HTMLInputElement).value).toEqual("lendo");

    fireEvent.click(screen.getByText("Submit"));
    expect(handleSubmit).toHaveBeenCalledWith({name: "lendo"});
});

test("should handle validation", () => {
    const validator = jest.fn((value: string) => value.length > 5);
    render(
        <Form onSubmit={noop}>
            <Field name="name" validators={[newSyncValidator(validator, "error", "error")]}>
                {(props) => (
                    <Fragment>
                        <input
                            placeholder="Enter name"
                            value={props.value}
                            onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                            onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                        />
                        <span data-testid="state">{props.state}</span>
                        {props.state === "error" ? <span data-testid="message">{props.message}</span> : null}
                    </Fragment>
                )}
            </Field>
        </Form>
    );

    fireEvent.blur(screen.getByPlaceholderText("Enter name"), {target: {value: ""}});
    expect(screen.getByTestId("state").innerHTML).toEqual("error");
    expect(screen.getByTestId("message").innerHTML).toEqual("error");

    fireEvent.blur(screen.getByPlaceholderText("Enter name"), {target: {value: "123456"}});
    expect(screen.getByTestId("state").innerHTML).toEqual("success");
});

test("should handle formatting of value", () => {
    const validator = jest.fn((value: string) => value.length > 5);
    const formatter = jest.fn((_: string) => "formatted");

    render(
        <Form onSubmit={noop}>
            <Field name="name" validators={[newSyncValidator(validator, "error", "error")]} formatter={formatter}>
                {(props) => (
                    <Fragment>
                        <input
                            placeholder="Enter name"
                            value={props.value}
                            onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                            onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                        />
                        <span data-testid="state">{props.state}</span>
                        {props.state === "error" ? <span data-testid="message">{props.message}</span> : null}
                    </Fragment>
                )}
            </Field>
        </Form>
    );

    fireEvent.blur(screen.getByPlaceholderText("Enter name"), {target: {value: ""}});
    expect(screen.getByTestId("state").innerHTML).toEqual("success");
    expect(formatter).toHaveBeenCalledWith("");
    expect(validator).toHaveBeenCalledWith("formatted", {name: ""});
});

test("should handle async validation", async () => {
    jest.useFakeTimers();
    const validator = jest.fn(
        (value: string) => new Promise<boolean>((res) => setTimeout(() => res(value.length > 5), 5000))
    );

    render(
        <Form onSubmit={noop}>
            <Field name="name" validators={[newAsyncValidator(validator, "error", "error")]}>
                {(props) => (
                    <Fragment>
                        <input
                            placeholder="Enter name"
                            value={props.value}
                            onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                            onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                        />
                        <span data-testid="state">{props.state}</span>
                        {props.state === "error" ? <span data-testid="message">{props.message}</span> : null}
                    </Fragment>
                )}
            </Field>
        </Form>
    );

    fireEvent.blur(screen.getByPlaceholderText("Enter name"), {target: {value: ""}});
    expect(screen.getByTestId("state").innerHTML).toEqual("pending");
    act(() => (jest.advanceTimersByTime(5000), undefined));
    expect((await screen.findByTestId("state")).innerHTML).toEqual("error");
});

test("should handle mixed async validation", async () => {
    jest.useFakeTimers();
    const validator1 = jest.fn((value: string) => value.length > 3);
    const validator2 = jest.fn(
        (value: string) => new Promise<boolean>((res) => setTimeout(() => res(value.length > 5), 5000))
    );

    render(
        <Form onSubmit={noop}>
            <Field
                name="name"
                validators={[
                    newSyncValidator(validator1, "error", "error 1"),
                    newAsyncValidator(validator2, "error", "error 2"),
                ]}
            >
                {(props) => (
                    <Fragment>
                        <input
                            placeholder="Enter name"
                            value={props.value}
                            onChange={(evt) => props.changeValue(evt.currentTarget.value)}
                            onBlur={(evt) => props.commitValue(evt.currentTarget.value)}
                        />
                        <span data-testid="state">{props.state}</span>
                        {props.state === "error" ? <span data-testid="message">{props.message}</span> : null}
                    </Fragment>
                )}
            </Field>
        </Form>
    );

    fireEvent.blur(screen.getByPlaceholderText("Enter name"), {target: {value: ""}});
    expect(screen.getByTestId("state").innerHTML).toEqual("pending");
    expect((await screen.findByTestId("state")).innerHTML).toEqual("error");
    expect((await screen.getByTestId("message")).innerHTML).toEqual("error 1");

    fireEvent.blur(screen.getByPlaceholderText("Enter name"), {target: {value: "1234"}});
    expect(screen.getByTestId("state").innerHTML).toEqual("pending");
    act(() => (jest.advanceTimersByTime(5000), undefined));
    expect((await screen.findByTestId("state")).innerHTML).toEqual("error");
    expect((await screen.getByTestId("message")).innerHTML).toEqual("error 2");
});
