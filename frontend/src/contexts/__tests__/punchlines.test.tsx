import React from "react";
import { render } from "@testing-library/react";
import ProviderWrapper from "../../utils/testing/ProviderWrapper";
import { PunchlinesProvider, usePunchlines } from "../punchlines";

const PunchlinesWrapper = () => (
  <ProviderWrapper Provider={PunchlinesProvider} />
);

describe("usePunchlines()", () => {
  const Component = () => {
    const { punchlines } = usePunchlines();
    expect(punchlines).toEqual([]);
    return <></>;
  };

  it("returns punchlines context when used inside PunchlinesProvider", () => {
    render(<Component />, { wrapper: PunchlinesWrapper });
  });

  it("throws error when used outside PunchlinesProvider", () => {
    /*
    Note: This throws an error in the test console:
    Uncaught [Error: usePunchlines() must be used within a PunchlinesProvider]
    There does not appear to be a way to disable this however the test is caught
    in the code below - nothing to see here!
     */
    expect(() => render(<Component />)).toThrow(
      "usePunchlines() must be used within a PunchlinesProvider"
    );
  });
});
