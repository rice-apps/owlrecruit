import { createTheme, MantineColorsTuple } from "@mantine/core";

// owl-purple: hsl(243 59% 67%) → #7c78d8 approx
const owlPurple: MantineColorsTuple = [
  "#eeeeff",
  "#d9d9f5",
  "#b2b0e9",
  "#8884dc",
  "#6460d2",
  "#4d49cb",
  "#433fc9",
  "#3632b2",
  "#2e2ba0",
  "#24228d",
];

// owl-teal: #13C9C0 accent
const owlTeal: MantineColorsTuple = [
  "#e6faf9",
  "#b3f0ed",
  "#80e5e1",
  "#4ddad5",
  "#1acfc9",
  "#13c9c0",
  "#10b3ab",
  "#0d9d97",
  "#0a8782",
  "#07716d",
];

export const theme = createTheme({
  primaryColor: "owlTeal",
  colors: {
    owlPurple,
    owlTeal,
  },
  fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
  headings: {
    fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
  },
  defaultRadius: "md",
  components: {
    Button: {
      defaultProps: {
        radius: "xl",
        color: "dark",
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
        withBorder: false,
      },
    },
    Badge: {
      defaultProps: {
        radius: "xl",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Textarea: {
      defaultProps: {
        radius: "md",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
    },
    Modal: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});
