// @ts-check
/// <reference path="../modules/types.js" />
/**
 * @file data/irregular-verbs-data.js
 * @description User Irregular Verbs Dataset (Initially Empty).
 * @AI-SECTION: IRREGULAR_VERBS_DATASET
 */

window.irregularVerbsData = [];

/**
 * Search irregular verb by any of its forms (V1, V2, V3)
 * @param {string} word
 * @returns {any|null}
 */
window.findIrregularVerb = function(word) {
  if (!word || typeof word !== "string") return null;
  const q = word.trim().toLowerCase();
  const list = window.irregularVerbsData || [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.v1 && item.v1.toLowerCase() === q) return item;
    const v2Parts = item.v2 ? item.v2.toLowerCase().split(/\s*\/\s*/) : [];
    if (v2Parts.includes(q)) return item;
    const v3Parts = item.v3 ? item.v3.toLowerCase().split(/\s*\/\s*/) : [];
    if (v3Parts.includes(q)) return item;
  }
  return null;
};
