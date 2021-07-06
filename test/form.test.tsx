import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {Form, Field} from "../src";

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
