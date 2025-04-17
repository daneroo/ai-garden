// This code runs in the browser context
// The main function that will be attached to window
window.parseEpubFromInputFiles = async function (base64Buffer) {
  const DEBUG_IN_PLAYWRIGHT = false;

  function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // get basename from path, just a regex, not thoroughly tested
  function getBasename(path) {
    const match = path.match(/([^\/\\]+)$/);
    return match ? match[0] : "";
  }

  // return the first "fixed href" found in the spineByHref
  function fixHref(href) {
    const spineByHref = book.spine.spineByHref;
    if (spineByHref.hasOwnProperty(href)) {
      return href;
    }
    // 1-Sometimes the href in the spine contains a fragment identifier
    const noFragmentIdHref = href.split("#")[0];
    if (spineByHref.hasOwnProperty(noFragmentIdHref)) {
      return noFragmentIdHref;
    }
    // Decode URI:
    const decodedHref = decodeURIComponent(href);
    if (spineByHref.hasOwnProperty(decodedHref)) {
      return decodedHref;
    }
    if (decodedHref.includes("%2C")) {
      console.log(`debug:section:decodedHref`);
      console.log(` - href:${href}`);
      console.log(` - decodedHref:${decodedHref}`);
    }
    const noFragmentIdDecodedHref = decodedHref.split("#")[0];
    if (spineByHref.hasOwnProperty(noFragmentIdDecodedHref)) {
      return noFragmentIdDecodedHref;
    }

    // look for any href in spineByHref that ends with noFragmentIdDecodedHref
    const keys = Object.keys(spineByHref);
    const foundEndsWithNoFragmentIdDecodedHref = keys.find((key) =>
      key.endsWith(noFragmentIdDecodedHref)
    );
    if (foundEndsWithNoFragmentIdDecodedHref) {
      return foundEndsWithNoFragmentIdDecodedHref;
    }
    const basenameOfNoFragmentIdDecodedHref = getBasename(
      noFragmentIdDecodedHref
    );
    const foundEndsWithBasenameOfNoFragmentIdDecodedHref = keys.find((key) =>
      key.endsWith(basenameOfNoFragmentIdDecodedHref)
    );
    if (foundEndsWithBasenameOfNoFragmentIdDecodedHref) {
      return foundEndsWithBasenameOfNoFragmentIdDecodedHref;
    }

    if (DEBUG_IN_PLAYWRIGHT) {
      console.log(`debug:section:fixHref (not found) ${href}`);
      console.log(`- debug:section:fixHref tried href:${href}`);
      console.log(
        `- debug:section:fixHref tried noFragmentIdHref:${noFragmentIdHref}`
      );
      console.log(`- debug:section:fixHref tried decodedHref:${decodedHref}`);
      console.log(
        `- debug:section:fixHref tried noFragmentIdDecodedHref:${noFragmentIdDecodedHref}`
      );
      console.log(
        `- debug:section:fixHref tried endsWith:noFragmentIdDecodedHref:${noFragmentIdDecodedHref}`
      );
      console.log(
        `- debug:section:fixHref tried endsWith:basenameOfNoFragmentIdDecodedHref:${basenameOfNoFragmentIdDecodedHref}`
      );
    }
  }

  // This will add textContent to each entry in the toc (and it's children)
  // or a warning if the section is not found
  async function augmentEntriesAndChildren(entries) {
    const newEntries = [];
    for (let entry of entries) {
      const { id, href, label, subitems } = entry;

      const shouldGetContent = true;
      let fixedHref;
      let section;
      let textContent;
      if (shouldGetContent) {
        fixedHref = fixHref(href);
        if (!fixedHref && DEBUG_IN_PLAYWRIGHT) {
          console.log(`debug:section not found for href:${href} id:${id}`);
          console.log(
            `debug:spine.spineByHref`,
            JSON.stringify(Object.keys(book.spine.spineByHref), null, 2)
          );
        }

        section = book.spine.get(fixedHref);
        const contents = section
          ? await section.load(book.load.bind(book))
          : undefined;

        const bodyElement = contents?.querySelector("body");
        textContent = bodyElement
          ? bodyElement.textContent
          : contents
          ? contents.textContent
          : undefined;
      }
      const children = await augmentEntriesAndChildren(subitems);
      newEntries.push({
        id,
        href,
        label,
        children,
        ...(textContent ? { textContent } : {}),
        ...(shouldGetContent && (!fixedHref || !section)
          ? {
              warning: `section not found for label:${label.trim()} href:${href} id:${id}`,
            }
          : {}),
      });
    }
    return newEntries;
  }

  const buffer = base64ToArrayBuffer(base64Buffer);
  const book = ePub(buffer);

  await book.opened;
  await book.loaded.navigation;
  await book.loaded.spine;

  const toc = [];
  book.navigation.toc.forEach((item) => toc.push(item));

  const newTOC = await augmentEntriesAndChildren(toc);
  return newTOC;
};
