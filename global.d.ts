/**
 * TypeScript type declarations for CSS modules
 * This prevents TypeScript errors when importing CSS files
 */
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
