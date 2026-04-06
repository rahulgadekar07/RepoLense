function cleanJSON(raw) {
  if (!raw) return raw;

  return raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

module.exports = cleanJSON;