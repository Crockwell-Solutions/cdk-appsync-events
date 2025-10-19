/**
 * Splits an array into chunks of a specified size.
 *
 * @typeParam T - The type of elements in the input array.
 * @param arr - The array to be split into chunks.
 * @param size - The maximum size of each chunk.
 * @returns An array of arrays, where each sub-array has at most `size` elements.
 *
 * @example
 * ```typescript
 * const data = [1, 2, 3, 4, 5];
 * const chunks = chunkArray(data, 2);
 * ```
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Helper function to check if string is actually a number
 * @param {string} str - The string to be checked
 * @returns {bool} - True if this string is a number
 */
export function isNumeric(str: number) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

/**
 * Helper function to round a number to a certain number of digits
 * @param {number} n - The number to be rounded
 * @param {number} digits - The number of digits to round to
 * @returns {number} - The rounded number
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function roundTo(n: any, digits: number) {
  let negative = false;
  if (digits === undefined) {
    digits = 0;
  }
  if (n < 0) {
    negative = true;
    n = n * -1;
  }
  const multiplicate = Math.pow(10, digits);
  n = parseFloat((n * multiplicate).toFixed(11));
  n = (Math.round(n) / multiplicate).toFixed(digits);
  if (negative) {
    n = (n * -1).toFixed(digits);
  }
  return n;
}

/**
 * Generates a random shard key prefix string for DynamoDB.
 *
 * @param prefixes - The number of possible prefix values to choose from. Defaults to 10.
 * @returns A string in the format `P{index}`, where `index` is a random integer between 1 and `prefixes`.
 */
export function getRandomShardPrefix(prefixes: number = 10): string {
  const randomIndex = Math.floor(Math.random() * prefixes) + 1;
  return `S${randomIndex}`;
}

/**
 * Generates an array of shard key prefixes in the format "S1", "S2", ..., "Sn".
 *
 * @param prefixes - The number of shard key prefixes to generate. Defaults to 10.
 * @returns An array of shard key prefix strings.
 */
export function getAllShardPrefixes(prefixes: number = 10, hash: string = ''): string[] {
  const shardKeys: string[] = [];
  for (let i = 1; i <= prefixes; i++) {
    shardKeys.push(`S${i}`);
  }
  if (hash) {
    return shardKeys.map((key) => `${key}#${hash}`);
  }
  return shardKeys;
}
