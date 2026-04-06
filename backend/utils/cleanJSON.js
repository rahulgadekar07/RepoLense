/**
 * cleanJSON.js
 * Fixes messy JSON output from Ollama:
 * - Strips markdown fences (```json ... ```)
 * - Extracts the first { } block
 * - Replaces raw newlines inside string values with \n
 * - Replaces raw tabs inside string values with \t
 */

function cleanJSON(text) {
  if (!text) return "{}";

  // 1. Strip markdown fences
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  // 2. Extract first { } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return "{}";
  text = text.substring(start, end + 1);

  // 3. Fix raw newlines/tabs inside JSON string values
  // This is the main fix — Ollama outputs real newlines inside strings
  // which breaks JSON.parse()
  text = fixRawNewlinesInStrings(text);

  return text;
}

function fixRawNewlinesInStrings(jsonText) {
  let result = "";
  let insideString = false;
  let i = 0;

  while (i < jsonText.length) {
    const char = jsonText[i];
    const prev = jsonText[i - 1];

    // Toggle string mode (but not on escaped quotes)
    if (char === '"' && prev !== "\\") {
      insideString = !insideString;
      result += char;
      i++;
      continue;
    }

    if (insideString) {
      // Replace raw newline with \n
      if (char === "\n") {
        result += "\\n";
        i++;
        continue;
      }
      // Replace raw carriage return with \r
      if (char === "\r") {
        result += "\\r";
        i++;
        continue;
      }
      // Replace raw tab with \t
      if (char === "\t") {
        result += "\\t";
        i++;
        continue;
      }
    }

    result += char;
    i++;
  }

  return result;
}

module.exports = cleanJSON;