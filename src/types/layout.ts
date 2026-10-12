import type { ReactNode } from "react";

export type ToolCardVariant = "pdf" | "image" | "newsletter";

export interface HeroSectionProps {
  id: string;
  title: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footnote?: ReactNode;
  decoration?: ReactNode;
}

export interface ToolCardProps {
  href: string;
  title: string;
  icon: ReactNode;
  description: ReactNode;
  tags?: readonly string[];
  cta?: ReactNode;
  variant: ToolCardVariant;
}

export interface InstructionStep {
  title: string;
  description: string;
  accent: ToolCardVariant;
}

export interface StepsSectionProps {
  id: string;
  title: string;
  description?: string;
  steps: readonly InstructionStep[];
}
