import { basename, join, extname } from "node:path";
import { mkdir } from "node:fs/promises";
import { exec, ExecException } from "node:child_process";

// only unzip if there is a single book
export async function unzipOneOfMany(
  matchingBookPaths: string[],
  parentDirForBook: string
): Promise<void> {
  if (matchingBookPaths.length > 1) {
    console.log(`Narrow your search to unzip a single book.`);
    for (const bookPath of matchingBookPaths) {
      console.log(`- ${basename(bookPath)}`);
    }
    return;
  }
  // unzip the book
  const bookPath = matchingBookPaths[0];
  console.log(`Unzipping ${basename(bookPath)} into ${parentDirForBook}/`);
  await unzipBook(bookPath, parentDirForBook);
}

export async function unzipBook(
  bookPath: string,
  parentDirForBook: string
): Promise<void> {
  const bookName = basename(bookPath);
  const slug = slugify(bookName);
  const targetDir = join(parentDirForBook, slug);

  // Create target directory
  await mkdir(targetDir, { recursive: true });

  const result = await execPromise(
    `unzip -q -o "${bookPath}" -d "${targetDir}"`
  );
  if (result.stderr) {
    console.error("- unzip.stderr:", result.stderr);
  }
  if (result.stdout) {
    console.log("- unzip.stdout:", result.stdout);
  }
  console.log(`Unzipped to ${targetDir}`);
}

/**
 * Creates a slug from a filename by:
 * - Removing the extension
 * - Converting to lowercase
 * - Replacing spaces and special characters with hyphens
 * - Removing any remaining special characters
 */
function slugify(filename: string): string {
  const name = basename(filename, extname(filename));
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ExecResult {
  stdout: string;
  stderr: string;
}

function execPromise(command: string): Promise<ExecResult> {
  return new Promise<ExecResult>((resolve, reject) => {
    exec(
      command,
      (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}
