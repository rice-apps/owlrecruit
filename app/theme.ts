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

export const theme = createTheme({
  primaryColor: "owlPurple",
  colors: {
    owlPurple,
  },
  fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
  defaultRadius: "md",
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        radius: "md",
        shadow: "sm",
        withBorder: true,
      },
    },
    Badge: {
      defaultProps: {
        radius: "sm",
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
