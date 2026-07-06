import { useEffect, useState } from 'react';
import { Select, Space, Tag, Typography, Spin } from 'antd';
import { getSections, getLevel } from '../api/notifications';

const { Text } = Typography;

// Rebuild the selections array from a stored deepLink for a given section.
function reconstruct(section, dl) {
  const count = section.levels.length;
  const sels = [];
  if (count >= 2) sels[0] = { id: dl.categoryId, name: dl.categoryName };
  if (count >= 3) sels[1] = { id: dl.subCategoryId, name: dl.subCategoryName };
  if (count >= 4) sels[2] = { id: dl.level3Id, name: dl.level3Name };
  sels[count - 1] = { id: dl.contentId, name: dl.contentTitle };
  return sels;
}

// Controlled cascading picker. Pass `initialDeepLink` (a notification.deepLink) to
// rehydrate on edit. Emits onChange({ sectionKey, selections, section, complete }).
export default function DeepLinkPicker({ initialDeepLink, onChange }) {
  const [sections, setSections] = useState([]);
  const [sectionKey, setSectionKey] = useState(null);
  const [selections, setSelections] = useState([]);
  const [optionsByLevel, setOptionsByLevel] = useState([]);
  const [loadingLevel, setLoadingLevel] = useState(-1);

  const section = sections.find((s) => s.key === sectionKey) || null;

  useEffect(() => {
    getSections()
      .then((res) => {
        const list = res.sections || [];
        setSections(list);
        // Rehydrate an existing deep link once we know section shapes.
        if (initialDeepLink && initialDeepLink.contentType) {
          const sec = list.find((s) => s.key === initialDeepLink.contentType);
          if (sec) {
            const sels = reconstruct(sec, initialDeepLink);
            setSectionKey(sec.key);
            setSelections(sels);
          }
        }
      })
      .catch(() => setSections([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load a level's options; parentId is the id of the previous level's selection.
  const loadLevel = async (secKey, index, parentId) => {
    setLoadingLevel(index);
    try {
      const res = await getLevel(secKey, index, parentId);
      setOptionsByLevel((prev) => {
        const next = [...prev];
        next[index] = res.data || [];
        return next;
      });
    } catch {
      setOptionsByLevel((prev) => {
        const next = [...prev];
        next[index] = [];
        return next;
      });
    } finally {
      setLoadingLevel(-1);
    }
  };

  // When section changes, load level 0 (and any deeper levels needed for rehydration).
  useEffect(() => {
    if (!sectionKey) {
      setOptionsByLevel([]);
      return;
    }
    setOptionsByLevel([]);
    loadLevel(sectionKey, 0, null);
    if (selections.length > 1) {
      for (let i = 1; i < selections.length; i += 1) {
        if (selections[i - 1]?.id) loadLevel(sectionKey, i, selections[i - 1].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  const emit = (secKey, sels) => {
    const sec = sections.find((s) => s.key === secKey);
    const complete = !!(sec && sels[sec.levels.length - 1]?.id);
    onChange?.({ sectionKey: secKey, selections: sels, section: sec, complete });
  };

  const onSectionChange = (key) => {
    setSectionKey(key || null);
    setSelections([]);
    emit(key || null, []);
  };

  const onLevelChange = (index, optId) => {
    const opt = (optionsByLevel[index] || []).find((o) => o._id === optId);
    const picked = opt ? { id: opt._id, name: opt.name } : null;
    const next = selections.slice(0, index);
    next[index] = picked;
    setSelections(next);
    emit(sectionKey, next);
    // Load the next level if this isn't the final one.
    if (section && picked && index < section.levels.length - 1) {
      loadLevel(sectionKey, index + 1, picked.id);
    }
  };

  return (
    <div>
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        style={{ width: '100%' }}
        placeholder="Link to a content section (optional)"
        value={sectionKey || undefined}
        onChange={onSectionChange}
        options={sections.map((s) => ({ value: s.key, label: `${s.icon || ''} ${s.label}` }))}
      />

      {section && (
        <Space direction="vertical" style={{ width: '100%', marginTop: 12 }} size={10}>
          {section.levels.map((levelLabel, index) => {
            // Enable a level only once its parent is chosen.
            const parentChosen = index === 0 || !!selections[index - 1]?.id;
            return (
              <div key={index}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {levelLabel}
                </Text>
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  disabled={!parentChosen}
                  loading={loadingLevel === index}
                  style={{ width: '100%' }}
                  placeholder={`Select ${levelLabel}`}
                  value={selections[index]?.id || undefined}
                  notFoundContent={loadingLevel === index ? <Spin size="small" /> : 'No items'}
                  onChange={(v) => onLevelChange(index, v)}
                  options={(optionsByLevel[index] || []).map((o) => ({
                    value: o._id,
                    label: o.date ? `${o.name} (${o.date})` : o.name,
                  }))}
                />
              </div>
            );
          })}

          {section && selections[section.levels.length - 1]?.id && (
            <Tag color="green" style={{ marginTop: 4 }}>
              Deep link ready → {selections[section.levels.length - 1].name}
            </Tag>
          )}
        </Space>
      )}
    </div>
  );
}
