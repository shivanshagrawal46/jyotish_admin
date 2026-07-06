import { Input, InputNumber, Select, Switch, Button, Card, Space, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import RichText from '../RichText.jsx';

function ItemField({ field, value, onChange }) {
  switch (field.type) {
    case 'number':
      return <InputNumber style={{ width: '100%' }} value={value} onChange={onChange} placeholder={field.label} />;
    case 'textarea':
      return <Input.TextArea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />;
    case 'richtext':
      return <RichText value={value} onChange={onChange} placeholder={field.label} />;
    case 'select':
      return (
        <Select
          style={{ width: '100%' }}
          value={value}
          onChange={onChange}
          options={(field.options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))}
          placeholder={field.label}
        />
      );
    case 'boolean':
      return <Switch checked={!!value} onChange={onChange} />;
    default:
      return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />;
  }
}

// Controlled editor for an array of objects (offers, prashan entries, responses...).
export default function ArrayEditor({ value = [], onChange, itemFields = [], addLabel = 'Add row' }) {
  const rows = Array.isArray(value) ? value : [];

  const update = (idx, key, val) => {
    const next = rows.map((row, i) => (i === idx ? { ...row, [key]: val } : row));
    onChange?.(next);
  };
  const addRow = () => {
    const blank = {};
    itemFields.forEach((f) => {
      blank[f.name] = f.type === 'number' ? undefined : f.type === 'boolean' ? false : '';
    });
    onChange?.([...rows, blank]);
  };
  const removeRow = (idx) => onChange?.(rows.filter((_, i) => i !== idx));

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        {rows.map((row, idx) => (
          <Card key={idx} size="small" styles={{ body: { padding: 12 } }}>
            <Row gutter={12} align="top">
              <Col flex="auto">
                <Row gutter={12}>
                  {itemFields.map((f) => (
                    <Col key={f.name} xs={24} md={f.span || (itemFields.length > 2 ? 12 : 24)}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{f.label || f.name}</div>
                      <ItemField field={f} value={row[f.name]} onChange={(v) => update(idx, f.name, v)} />
                    </Col>
                  ))}
                </Row>
              </Col>
              <Col flex="40px" style={{ textAlign: 'right' }}>
                <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeRow(idx)} />
              </Col>
            </Row>
          </Card>
        ))}
      </Space>
      <Button type="dashed" icon={<PlusOutlined />} onClick={addRow} block style={{ marginTop: 10 }}>
        {addLabel}
      </Button>
    </div>
  );
}
