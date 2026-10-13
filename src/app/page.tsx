import { HeroSection } from "@/components/common/HeroSection";
import { BentoGrid } from "@/components/common/BentoGrid";
import { ToolCard } from "@/components/common/ToolCard";
import { StatCard } from "@/components/common/StatCard";
import { StepsSection } from "@/components/common/StepsSection";
import type { InstructionStep } from "@/types/layout";
import Link from "next/link";

const tools = [
  { label: "PDF Tools", href: "/pdf-tools", icon: "📄", gradient: "from-[#FF5470] to-[#FF9A3C]", shadow: "shadow-[0_14px_28px_-12px_rgba(255,84,112,.6)]" },
  { label: "Image Tools", href: "/image-tools", icon: "🖼️", gradient: "from-[#3B6EF6] to-[#22D3EE]", shadow: "shadow-[0_14px_28px_-12px_rgba(59,110,246,.6)]" },
  { label: "AI Newsletter", href: "/ai-newsletter", icon: "✨", gradient: "from-[#8B5CF6] to-[#EC4899]", shadow: "shadow-[0_14px_28px_-12px_rgba(139,92,246,.6)]" },
];
const steps: InstructionStep[] = [
  { title: "Pick a tool", description: "Choose PDF, Image or Newsletter from the navbar or home.", accent: "newsletter" },
  { title: "Drop your files", description: "Drag & drop or browse. Tweak the options to taste.", accent: "image" },
  { title: "Download", description: "Grab your result instantly — processed right in your browser.", accent: "pdf" },
];
const cardInteraction = "transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9061F0] motion-reduce:transform-none motion-reduce:transition-none";

export default function Home() {
  return (
    <>
      <HeroSection
        id="hero-title"
        badge="✦ Three tools, zero friction"
        title={<>All your everyday tools,<br /><span className="bg-linear-120 from-[#9061F0] via-[#EC4899] via-55% to-[#FF9A3C] bg-clip-text text-transparent">in one playful place.</span></>}
        description="Fix PDFs, transform images, and spin up an AI newsletter — all in your browser. No sign-up, no uploads, no waiting."
        actions={
          tools.map(tool => <Link key={tool.href} href={tool.href} className={`inline-flex min-h-11 items-center gap-[9px] rounded-[13px] bg-linear-135 px-[22px] py-3.5 text-[15px] font-bold text-white ${tool.gradient} ${tool.shadow} ${cardInteraction}`}><span aria-hidden="true">{tool.icon}</span>{tool.label}</Link>)
        }
        footnote="100% in-browser · Free forever · Files never leave your device"
        decoration={
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden min-[760px]:block">
            {tools.map((tool, index) => <div key={tool.href} className={`absolute flex items-center gap-[11px] rounded-[18px] border border-border bg-surface px-[15px] py-[13px] shadow-[0_18px_36px_-18px_rgba(124,58,237,.4)] motion-safe:animate-floaty ${index === 0 ? "bottom-5 left-[6%] min-[1100px]:top-[230px] min-[1100px]:bottom-auto" : index === 1 ? "right-[7%] bottom-5 [animation-delay:.8s] [animation-duration:7s] min-[1100px]:top-[200px] min-[1100px]:bottom-auto" : "top-5 right-[11%] [animation-delay:.4s] [animation-duration:6.5s] min-[1100px]:top-auto min-[1100px]:bottom-[60px]"}`}>
              <span className={`flex size-[38px] items-center justify-center rounded-[11px] bg-linear-135 text-[19px] ${tool.gradient}`}>{tool.icon}</span>
              <div><div className="text-[13.5px] font-bold">{["Merge PDFs", "Resize image", "AI digest"][index]}</div><div className="text-[11.5px] text-mute">{["drag & drop", "any format", "in seconds"][index]}</div></div>
            </div>)}
          </div>
        }
      />
      <BentoGrid label="Explore tools">
        <ToolCard variant="pdf" href="/pdf-tools" title="PDF Tools" icon="📄" description="Merge PDFs or extract selected pages in a couple of clicks." tags={["Merge", "Split"]} cta="Open PDF Tools →" />
        <ToolCard variant="image" href="/image-tools" title="Image Tools" icon="🖼️" description="Resize, convert formats and compress — with a live before/after preview." cta="Open →" />
        <ToolCard variant="newsletter" href="/ai-newsletter" title="AI Newsletter" icon="✨" description="Auto-collect & summarize the news." />
        <StatCard title="< 3 clicks" description="to finish any task. Everything runs locally — your files stay on your device." />
      </BentoGrid>
      <StepsSection id="how-title" title="How it works" description="Three steps. No accounts, no friction." steps={steps} />
    </>
  );
}
