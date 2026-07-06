// Build the dl_* payload the backend's buildDeepLink expects from the chosen
// section + cascading selections. Kept UI-agnostic so it can be unit-tested and
// so DeepLinkPicker.jsx only exports a component (keeps React Fast Refresh happy).
export function buildDlPayload(section, selections) {
  if (!section) return {};
  const count = section.levels.length;
  const final = selections[count - 1];
  if (!final || !final.id) return { dl_contentType: section.key }; // incomplete
  const p = {
    dl_contentType: section.key,
    dl_contentId: final.id,
    dl_contentTitle: final.name,
  };
  if (count >= 2 && selections[0]) {
    p.dl_categoryId = selections[0].id;
    p.dl_categoryName = selections[0].name;
  }
  if (count >= 3 && selections[1]) {
    p.dl_subCategoryId = selections[1].id;
    p.dl_subCategoryName = selections[1].name;
  }
  if (count >= 4 && selections[2]) {
    p.dl_level3Id = selections[2].id;
    p.dl_level3Name = selections[2].name;
  }
  return p;
}
