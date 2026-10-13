import { Brand } from "@/components/Brand";

export function Footer() {
  return (
    <footer className="mt-20 w-full shrink-0 border-t border-border px-[clamp(16px,5vw,56px)] pt-8 pb-12">
      <div className="flex flex-col items-start gap-4 min-[760px]:flex-row min-[760px]:items-center min-[760px]:justify-between">
        <div className="flex flex-wrap items-center gap-2.5"><Brand compact /><span className="text-sm text-mute">— tiny tools, big time savings.</span></div>
        <div className="flex flex-wrap gap-x-[22px] gap-y-2 text-sm text-soft"><span>Privacy</span><span>GitHub</span><span>Made with ✦</span></div>
      </div>
    </footer>
  );
}
