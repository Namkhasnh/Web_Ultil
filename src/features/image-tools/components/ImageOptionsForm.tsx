import type { ImageFile, ImageSettings } from "../types";

export const imagePrimaryButton = "min-h-11 cursor-pointer rounded-xl bg-linear-to-br from-[#3B6EF6] to-[#22D3EE] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_-14px_rgba(59,110,246,.7)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B6EF6] disabled:cursor-default disabled:opacity-60";
const inputClass = "mt-1.5 min-h-11 w-full rounded-[10px] border border-[var(--input-border)] bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-[#3B6EF6]";
type Props = { settings: ImageSettings; selected?: ImageFile; busy: boolean; hasFiles: boolean; onChange: (patch: Partial<ImageSettings>) => void; onProcess: () => Promise<void>; onSample: () => Promise<void> };
export function ImageOptionsForm({ settings, selected, busy, hasFiles, onChange, onProcess, onSample }: Props) {
  let width = settings.width; let height = settings.height;
  if (settings.maintainAspectRatio && selected?.width && selected.height) {
    if (settings.lastDimension === "width") height = Number(width) > 0 ? String(Math.max(1, Math.round(Number(width) * selected.height / selected.width))) : "";
    else width = Number(height) > 0 ? String(Math.max(1, Math.round(Number(height) * selected.width / selected.height))) : "";
  }
  return <form onSubmit={event => { event.preventDefault(); void (hasFiles ? onProcess() : onSample()); }} className="mt-4 rounded-[18px] border border-border bg-surface p-5">
    <h2 className="font-heading text-base font-bold">Settings</h2>
    <fieldset disabled={busy} className="mt-3.5 space-y-3 disabled:opacity-60"><legend className="sr-only">{settings.operation} options</legend>
      {settings.operation === "resize" && <>
        <label className="block text-sm font-semibold text-soft">Resize by<select aria-label="Resize by" value={settings.resizeMode} onChange={event => onChange({ resizeMode: event.target.value as ImageSettings["resizeMode"] })} className={inputClass}><option value="pixels">Pixels</option><option value="percentage">Percentage</option></select></label>
        {settings.resizeMode === "pixels" ? <><div className="flex gap-3">
          <label className="min-w-0 flex-1 text-xs font-semibold text-soft">Width<input aria-label="Width" type="number" min="1" max="8192" step="1" value={width} onChange={event => onChange({ width: event.target.value, height, lastDimension: "width" })} className={inputClass} /></label>
          <label className="min-w-0 flex-1 text-xs font-semibold text-soft">Height<input aria-label="Height" type="number" min="1" max="8192" step="1" value={height} onChange={event => onChange({ height: event.target.value, width, lastDimension: "height" })} className={inputClass} /></label>
        </div><label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-soft"><input type="checkbox" checked={settings.maintainAspectRatio} onChange={event => onChange({ maintainAspectRatio: event.target.checked, width, height })} className="size-5 accent-[#3B6EF6]" />Lock aspect ratio{selected?.width ? ` (${selected.width}:${selected.height})` : " (original)"}</label></> : <label className="block text-sm font-semibold text-soft">Scale (%)<input aria-label="Scale (%)" type="number" min="0.01" step="any" value={settings.scalePercent} onChange={event => onChange({ scalePercent: event.target.value })} className={inputClass} /></label>}
      </>}
      {settings.operation === "convert" && <><p className="text-xs font-semibold text-soft">Output format</p><div className="flex flex-wrap gap-2" role="group" aria-label="Output format">{(["png", "jpeg", "webp"] as const).map(format => <button key={format} type="button" aria-pressed={settings.outputFormat === format} onClick={() => onChange({ outputFormat: format })} className={`min-h-11 cursor-pointer rounded-[10px] border px-4 text-sm font-bold ${settings.outputFormat === format ? "border-[#3B6EF6] bg-[#3B6EF6] text-white" : "border-border text-soft"}`}>{format === "jpeg" ? "JPG" : format === "webp" ? "WebP" : "PNG"}</button>)}</div><p className="text-xs text-mute">Original dimensions. JPG uses a white background.</p></>}
      {settings.operation === "compress" && <><div className="flex justify-between text-sm"><label htmlFor="image-quality" className="font-semibold text-soft">Quality</label><output htmlFor="image-quality" className="font-bold text-[#3B6EF6]">{Math.round(settings.quality * 100)}%</output></div>
        <div className="relative flex h-11 items-center">
          <svg aria-hidden="true" viewBox="0 0 100 2" preserveAspectRatio="none" className="pointer-events-none absolute h-1.5 w-full rounded-full bg-surface2"><rect width={(settings.quality * 100 - 10) / 90 * 100} height="2" fill="#3B6EF6" /></svg>
          <input id="image-quality" type="range" min="10" max="100" value={Math.round(settings.quality * 100)} onChange={event => onChange({ quality: Number(event.target.value) / 100 })} className="relative min-h-11 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B6EF6] [&::-moz-range-thumb]:size-[22px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#3B6EF6] [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3B6EF6]" />
        </div><div className="flex justify-between text-xs text-mute"><span>Smaller file</span><span>Best quality</span></div><p className="text-xs text-mute">Keeps each image’s original format. Some images may not get smaller.</p><p className="text-xs text-mute">Quality applies to JPG and WebP. PNG is re-encoded losslessly; quality does not affect PNG file size.</p></>}
    </fieldset>
    <button disabled={busy} type="submit" className={`${imagePrimaryButton} mt-4 w-full`}>{busy ? "Working…" : hasFiles ? "Apply" : "+ Add a sample image"}</button>
  </form>;
}
