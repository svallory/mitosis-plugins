declare module "@ui/CodeExample.astro" {
  interface CodeExampleProps {
    title?: string;
  }

  export default function CodeExample(props: CodeExampleProps): any;
}

declare module "@ui/FeatureCard.astro" {
  interface FeatureCardProps {
    title: string;
    icon?: string;
    href?: string;
  }

  export default function FeatureCard(props: FeatureCardProps): any;
}

declare module "@ui/Grid.astro" {
  interface GridProps {
    columns?: 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
  }

  export default function Grid(props: GridProps): any;
}

declare module "@ui/PluginCard.astro" {
  interface PluginCardProps {
    title: string;
    description: string;
    href: string;
    status?: 'stable' | 'beta' | 'experimental';
  }

  export default function PluginCard(props: PluginCardProps): any;
}

declare module "@ui/Section.astro" {
  interface SectionProps {
    title?: string;
    description?: string;
  }

  export default function Section(props: SectionProps): any;
}

declare module "@ui/StepList.astro" {
  interface StepListProps {
    steps: Array<{
    title: string;
    description: string;
    }>;
  }

  export default function StepList(props: StepListProps): any;
}

declare module "@ui/TeamMemberCard.astro" {
  interface TeamMemberCardProps {
    name: string;
    role: string;
    bio: string;
    avatar: string;
    location?: string;
    github: string;
    website?: string;
    twitter?: string;
  }

  export default function TeamMemberCard(props: TeamMemberCardProps): any;
}
