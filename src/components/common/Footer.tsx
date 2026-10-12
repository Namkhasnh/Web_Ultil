import { Brand } from "@/components/Brand";

export function Footer() {
  return (
      <footer className="mx-auto mt-20 flex w-full max-w-[1140px] flex-wrap items-center justify-between gap-4 border-t border-border px-6 pt-8 pb-12">
    <div className="flex flex-wrap items-center gap-2.5"><Brand compact /><span className="text-sm text-mute">— tiny tools, big time savings.</span></div>
    <div className="flex gap-[22px] text-sm text-soft"><span>Privacy</span><span>GitHub</span><span>Made with ✦</span></div>
      </footer>
  );
}
