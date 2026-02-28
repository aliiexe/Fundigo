import React from "react";
import { render, screen } from "@testing-library/react";
import { LandingLayout } from "@/components/landing/LandingLayout";

describe("LandingLayout", () => {
  it("renders skip-to-content link that is focusable", () => {
    render(
      <LandingLayout>
        <div>Content</div>
      </LandingLayout>
    );
    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });
});
