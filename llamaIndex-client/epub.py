import os
import re
import argparse
import ebooklib
import html2text
from ebooklib import epub
from bs4 import BeautifulSoup


default_root_path = "/Users/daniel/Library/CloudStorage/Dropbox/A-Reading/EBook"
# const default_root_path =  "/Volumes/Reading/audiobooks/";


def debug(obj):
    import pprint

    pp = pprint.PrettyPrinter(indent=4)
    pp.pprint(obj)


def get_content_for_href(book, href):
    text_maker = html2text.HTML2Text()
    text_maker.ignore_links = True
    text_maker.ignore_images = True
    text_maker.ignore_tables = True
    text_maker.ignore_emphasis = True
    text_maker.ignore_anchors = True
    text_maker.single_line_break = True

    # Split href into the base and fragment identifier
    href_parts = href.split("#", 1)
    href_without_fragment = href_parts[0]
    fragment = href_parts[1] if len(href_parts) > 1 else None

    content_item = book.get_item_with_href(href_without_fragment)
    if not content_item:
        return None  # Early return if no content item is found

    decoded_content = content_item.content.decode("utf-8")

    # If we have a fragment, let's try to get the specific content
    if fragment:
        soup = BeautifulSoup(decoded_content, "html.parser")
        # Find the element with the specified id
        target_element = soup.find(id=fragment)
        if target_element:
            content = str(target_element)
        else:
            # If the fragment isn't found, let's return a warning or None.
            # Choose based on your requirements.
            return f"Warning: Fragment '{fragment}' not found in document!"
    else:
        content = decoded_content

    # Convert content to markdown
    markdown_content = text_maker.handle(content)
    compact_content = re.sub(r"\s+", " ", markdown_content).strip()
    return compact_content


# item is ebooklib.epub.Link or ebooklib.epub.Section
def print_toc_item(indent, item, book):
    # early return if item is not Link or Section
    if not isinstance(item, ebooklib.epub.Link) and not isinstance(
        item, ebooklib.epub.Section
    ):
        return

    typeHint = "Link/Leaf" if isinstance(item, ebooklib.epub.Link) else "Section/Parent"
    print(
        f"{indent}- {item.title if item.title else 'No Title'} ({item.href if item.href else 'No Href'}, {typeHint})"
    )

    # Print content if it exists. This is probably only for Link/Leafs
    compact_content = get_content_for_href(book, item.href)
    if compact_content:
        print(
            f"{indent}    {compact_content[:75]}{'' if len(compact_content) < 75 else '...'}"
        )


def traverse_toc(toc, book, level=0):
    indent = "  " * level

    # sometimes the whole toc is actually not a tree but a single leaf
    # This should be flagged in validation
    # e.g Redbreast, I Robot
    if isinstance(toc, ebooklib.epub.Link):
        item = toc
        print_toc_item(indent, item, book)
        return

    # traverse the tree
    for item in toc:
        if isinstance(item, ebooklib.epub.Link):
            print_toc_item(indent, item, book)
        elif isinstance(item, tuple) and len(item) == 2:  # It's a section with children
            section, children = item
            print_toc_item(indent, section, book)
            traverse_toc(children, book, level + 1)
        else:
            print(
                f"{indent}This should never happen: Unexpected type or structure in TOC: ({type(item)}), {item}"
            )


parser = argparse.ArgumentParser(description="Process some command line arguments.")
parser.add_argument("-l", "--list", action="store_true", help="List available models")
parser.add_argument("-v", "--verbose", action="store_true", help="Print verbose output")
parser.add_argument(
    "-r",
    "--root",
    type=str,
    help="Path of the root directory to search from",
    default=default_root_path,
)
parser.add_argument(
    "-s",
    "--search",
    type=str,
    help="filter the list of books by a search term",
    default="",
)
parser.add_argument(
    "-f",
    "--file",
    type=str,
    help="Process a specific book file",
    default="",
)


args = parser.parse_args()

# if !args.root and !args.search and !args.file:
#     print("Please specify a root directory, search term, or file to process")
#     exit(1)

if args.root:
    print(f"Root path: {args.root}")
if args.search:
    print(f"Search string: {args.search}")


# fetch a list of all the epub books in the root directory
root_path = args.root
book_paths = []
for dirpath, dirnames, filenames in os.walk(root_path):
    for filename in filenames:
        if args.search and not re.search(args.search, filename, re.IGNORECASE):
            continue
        if filename.endswith(".epub"):
            book_paths.append(os.path.join(dirpath, filename))

print(f"Found {len(book_paths)} books")

text_maker = html2text.HTML2Text()
text_maker.ignore_links = True
text_maker.ignore_images = True
text_maker.ignore_tables = True
text_maker.ignore_emphasis = True
text_maker.ignore_anchors = True
text_maker.single_line_break = True

# for each book, ...
for book_path in book_paths:
    print(f"\nBook: {book_path}")
    # open the book
    book = epub.read_epub(book_path, options={"ignore_ncx": True})

    # debug(book.metadata)
    # debug(book.spine)
    # debug(book.toc)
    # iterate through toc, which is a list of Section/Link objects
    traverse_toc(book.toc, book)

    continue

    # Iterate through all chapters.
    # for item in book.get_items():
    for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        # Chapters are typically located in epub documents items.
        print(f"- {item.get_name()} ")
        # markdown_content = html2text.html2text(item.get_content().decode("utf-8"))
        markdown_content = text_maker.handle(item.get_content().decode("utf-8"))
        # contract all whitespace \n\t " ",...
        compact_content = re.sub(r"\s+", " ", markdown_content).strip()
        print(f"   {compact_content[:75]}{'' if len(compact_content) < 75 else '...'}")

        #     if item.get_type() == ebooklib.ITEM_DOCUMENT:
    #         text_list.append(
    #             html2text.html2text(item.get_content().decode("utf-8"))
    #         )

    # text = "\n".join(text_list)
