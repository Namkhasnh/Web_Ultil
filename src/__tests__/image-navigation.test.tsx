import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/Navbar";

vi.mock("next/navigation", () => ({ usePathname: () => "/image-tools" }));
describe("image navigation", () => {
  it("marks Image Tools active in desktop and mobile navigation", async () => {
    render(<Navbar />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: "Image Tools" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Image Tools" })).toHaveClass("text-[#3B6EF6]");
    expect(within(nav).getByRole("link", { name: "PDF Tools" })).not.toHaveAttribute("aria-current");
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const mobile = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(mobile).getByRole("link", { name: "Image Tools" })).toHaveAttribute("aria-current", "page");
  });
});
