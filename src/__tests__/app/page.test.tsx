import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("WebUtil home", () => {
  it("renders the landing content and tool destinations", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("All your everyday tools,in one playful place.");
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    for (const [name, href] of [["PDF Tools", "/pdf-tools"], ["Image Tools", "/image-tools"], ["AI Newsletter", "/ai-newsletter"]]) {
      for (const link of screen.getAllByRole("link", { name: new RegExp(name) })) {
        expect(link).toHaveAttribute("href", href);
      }
    }
  });

});
