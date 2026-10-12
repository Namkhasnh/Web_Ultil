import { render, screen, within } from "@testing-library/react";
import { HeroSection } from "@/components/common/HeroSection";
import { BentoGrid } from "@/components/common/BentoGrid";
import { ToolCard } from "@/components/common/ToolCard";
import { StatCard } from "@/components/common/StatCard";
import { StepsSection } from "@/components/common/StepsSection";

describe("reusable layout sections", () => {
  it("accepts feature content without homepage text or required optional slots", () => {
    render(
      <>
        <HeroSection id="feature-title" title="Prepare your files" />
        <BentoGrid label="Related tools">
          <ToolCard variant="image" href="/image-tools" title="Convert an image" icon="🖼️" description="Choose an output format." tags={["WebP"]} cta="Start converting" />
          <StatCard title="Local processing" description="Your file stays here." />
        </BentoGrid>
        <StepsSection id="feature-steps" title="Conversion steps" steps={[
          { title: "Select", description: "Choose a file.", accent: "image" },
          { title: "Save", description: "Download the result.", accent: "pdf" },
        ]} />
      </>,
    );
    expect(screen.getByRole("region", { name: "Prepare your files" })).toBeInTheDocument();
    expect(screen.queryByText("✦ Three tools, zero friction")).not.toBeInTheDocument();
    const grid = screen.getByRole("region", { name: "Related tools" });
    expect(within(grid).getByRole("link", { name: /Convert an image/ })).toHaveAttribute("href", "/image-tools");
    expect(within(grid).getByText("WebP")).toBeInTheDocument();
    expect(within(grid).getByText("Start converting")).toBeInTheDocument();
    expect(within(grid).getByText("Local processing")).toBeInTheDocument();
    const items = within(screen.getByRole("region", { name: "Conversion steps" })).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("1")).toBeInTheDocument();
    expect(within(items[1]).getByText("2")).toBeInTheDocument();
  });
});
