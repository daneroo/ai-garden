// Placeholder for epub.js types if not available
// We'll rely on any or minimal typing for now as epubjs types are often partial
declare module "epubjs" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ePub: any;
  export default ePub;
}
