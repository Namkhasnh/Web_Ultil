import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteLayout } from "@/components/common/SiteLayout";
import Home from "@/app/page";

describe("WebUtil site layout", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(["home", "feature"])("renders one shared shell for %s content", (page) => {
    render(<SiteLayout>{page === "home" ? <Home /> : <section><h1>Feature content</h1></section>}</SiteLayout>);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("link", { name: "Open app" })).toHaveAttribute("href", "/pdf-tools");
    expect(screen.getByText("Privacy")).not.toHaveAttribute("href");
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("toggles the theme and restores the saved choice after remount", async () => {
    const user = userEvent.setup();
    const view = render(<SiteLayout><h1>Feature content</h1></SiteLayout>);
    expect(document.documentElement.dataset.theme).toBe("light");
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("webutil-theme")).toBe("dark");
    view.unmount();
    render(<SiteLayout><h1>Feature content</h1></SiteLayout>);
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("webutil-theme")).toBe("light");
  });

  it("keeps the theme usable when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    render(<SiteLayout><h1>Feature content</h1></SiteLayout>);
    await userEvent.setup().click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  it("opens and closes the mobile menu with accessible navigation", async () => {
    const user = userEvent.setup();
    render(<SiteLayout><h1>Feature content</h1></SiteLayout>);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(menu).getByRole("link", { name: "PDF Tools" })).toHaveAttribute("href", "/pdf-tools");
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    within(screen.getByRole("navigation", { name: "Mobile navigation" })).getByRole("link", { name: "PDF Tools" }).focus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
  });
});
