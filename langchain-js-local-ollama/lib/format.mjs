/**
 * Format types.
 * @readonly
 * @enum {string}
 */
export const SizeFormat = {
  SI: "SI",
  IEC: "IEC",
};

/**
 * SI Units for size formatting.
 * @type {string[]}
 */
const SIUnits = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

/**
 * IEC Units for size formatting.
 * @type {string[]}
 */
const IECUnits = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB"];

/**
 * Formats the given size into a human-readable string.
 * Example usage:
 * console.log("1500 (default):", formatSize(1500)); // Default IEC format: 1.46 KiB
 * console.log("1500 (SI)     :", formatSize(1500, SizeFormat.SI)); // SI format: 1.50 KB
 * console.log("1500 (IEC)    :", formatSize(1500, SizeFormat.IEC)); // IEC format: 1.46 KiB
 *
 * @param {number} size - The size to format.
 * @param {SizeFormat} [format=SizeFormat.IEC] - The format to use (SI or IEC).
 * @returns {string} The formatted size string.
 */
export function formatSize(size, format = SizeFormat.IEC) {
  const units = format === SizeFormat.SI ? SIUnits : IECUnits;
  const threshold = format === SizeFormat.SI ? 1000 : 1024;

  if (size < threshold) {
    return `${size} ${units[0]}`; // No decimal for bytes
  }

  let index = 0;
  let formattedSize = size;

  while (formattedSize >= threshold && index < units.length - 1) {
    formattedSize /= threshold;
    index++;
  }

  return `${index === 0 ? formattedSize : formattedSize.toFixed(2)} ${
    units[index]
  }`;
}
