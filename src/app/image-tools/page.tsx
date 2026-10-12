import type { Metadata } from "next";
import { ImageTools } from "@/features/image-tools";

export const metadata: Metadata = { title: "Image Tools — WebUtil", description: "Resize, convert and compress images locally in your browser." };
export default function ImageToolsPage() { return <ImageTools />; }
