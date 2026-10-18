import { render, screen } from "@testing-library/react";
import { Price } from "./price";

describe("Price", () => {
  it("shows the price", () => {
    render(<Price amount={49.99} />);
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("shows the was price and discount only when there is a saving", () => {
    const { rerender } = render(<Price amount={39.99} compareAt={49.99} />);
    expect(screen.getByText("$49.99")).toBeInTheDocument();
    expect(screen.getByText("−20%")).toBeInTheDocument();

    rerender(<Price amount={19.99} compareAt={19.99} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
