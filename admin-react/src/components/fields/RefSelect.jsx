import { useEffect, useState } from 'react';
import { Select } from 'antd';
import { listResource } from '../../api/resources';

// Async single-select backed by another resource. Options come from
// GET /resources/<resource>?all=1 (optionally filtered by a parent).
export default function RefSelect({ resource, labelField = 'name', parent, value, onChange, placeholder }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listResource(resource, { all: 1, parent })
      .then((data) => {
        if (!active) return;
        const items = data.items || [];
        setOptions(
          items.map((it) => ({
            value: it._id,
            label: String(it[labelField] ?? it.name ?? it.title ?? it._id),
          }))
        );
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [resource, labelField, parent]);

  return (
    <Select
      showSearch
      allowClear
      loading={loading}
      value={value}
      onChange={onChange}
      placeholder={placeholder || 'Select'}
      options={options}
      optionFilterProp="label"
      filterOption={(input, opt) => (opt?.label || '').toLowerCase().includes(input.toLowerCase())}
    />
  );
}
