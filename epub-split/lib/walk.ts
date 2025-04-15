/**
 * A direct port of @root/walk
 * https://www.npmjs.com/package/@root/walk
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { Dirent, Stats } from "node:fs";

type DirentLike = Dirent | (Stats & { name: string });

// walkFunc can return three types:
// - boolean: false to skip, true to continue
// - void: undefined, treated as continue
// - Error: an error occurred
type WalkFunc = (
  err: Error | null,
  pathname: string,
  dirent: DirentLike
) => Promise<boolean | void | Error>;

export const skipDir = new Error("skip this directory");
const _withFileTypes = { withFileTypes: true } as const;
const pass = (err: Error) => err;

// a port of Go's filepath.Walk
const walk = async (
  pathname: string,
  walkFunc: WalkFunc,
  _dirent?: DirentLike
): Promise<boolean | void | Error> => {
  let err: Error | null | boolean | void = null;

  // special case of the very first run
  if (!_dirent) {
    let _name = path.basename(path.resolve(pathname));
    // original code:_dirent = await fs.lstat(pathname).catch(pass);
    const stats = await fs.lstat(pathname).catch(pass);
    if (stats instanceof Error) {
      err = stats;
      // I added this throw early return, to avoid _dirent being undefined below
      throw err;
    } else {
      _dirent = {
        name: _name,
        isDirectory: () => stats.isDirectory(),
        isFile: () => stats.isFile(),
      } as DirentLike;
    }
  }

  // run the user-supplied function and either skip, bail, or continue
  err = await walkFunc(err, pathname, _dirent).catch(pass);
  if (err === false || err === skipDir) {
    return; // Skip this directory
  }
  if (err instanceof Error) {
    throw err;
  }
  // No error, continue
  err = null;

  // "walk does not follow symbolic links"
  if (!_dirent.isDirectory()) {
    return;
  }
  let result = await fs.readdir(pathname, _withFileTypes).catch(pass);
  if (result instanceof Error) {
    return walkFunc(result, pathname, _dirent);
  }
  for (let dirent of result) {
    await walk(path.join(pathname, dirent.name), walkFunc, dirent);
  }
};

export { walk };
