// As create-next-app sets it up since Next.js 16: with Cache Components, pages and GET route handlers that read no
// request data are prerendered when the app builds, and the build fails if one reads a random number or the date.
export default { cacheComponents: true, partialPrefetching: true };
