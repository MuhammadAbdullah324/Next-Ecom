import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuantityStepper } from "./quantity-stepper";

describe("QuantityStepper", () => {
  it("stays between 1 and the stock limit", async () => {
    const onChange = jest.fn();
    const { rerender } = render(<QuantityStepper value={1} max={2} onChange={onChange} label="Quantity" />);
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(2);

    rerender(<QuantityStepper value={2} max={2} onChange={onChange} label="Quantity" />);
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  });
});
