import type { Metadata } from "next";
import { PdfTools } from "@/features/pdf-tools";

export const metadata: Metadata = { title: "PDF Tools — WebUtil", description: "Merge PDFs and extract selected pages locally in your browser." };
export default function PdfToolsPage() { return <PdfTools />; }
