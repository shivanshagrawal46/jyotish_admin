import { Form, Input, InputNumber, Switch, Select, DatePicker } from 'antd';
import RichText from './RichText.jsx';
import ImageUpload from './ImageUpload.jsx';
import MultiImageUpload from './fields/MultiImageUpload.jsx';
import RefSelect from './fields/RefSelect.jsx';
import ArrayEditor from './fields/ArrayEditor.jsx';

function toOptions(options = []) {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

function control(field) {
  switch (field.type) {
    case 'textarea':
      return <Input.TextArea rows={field.rows || 3} placeholder={field.placeholder} />;
    case 'richtext':
      return <RichText placeholder={field.placeholder} />;
    case 'number':
      return <InputNumber min={field.min} max={field.max} style={{ width: '100%' }} placeholder={field.placeholder} />;
    case 'boolean':
      return <Switch checkedChildren="Yes" unCheckedChildren="No" />;
    case 'select':
      return <Select allowClear options={toOptions(field.options)} placeholder={field.placeholder || 'Select'} />;
    case 'multiselect':
      return (
        <Select
          mode="multiple"
          allowClear
          options={toOptions(field.options)}
          placeholder={field.placeholder || 'Select'}
        />
      );
    case 'tags':
      return <Select mode="tags" tokenSeparators={[',']} placeholder={field.placeholder || 'Type and press enter'} />;
    case 'date':
      return <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />;
    case 'datetime':
      return <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />;
    case 'image':
      return <ImageUpload />;
    case 'images':
      return <MultiImageUpload />;
    case 'ref':
      return <RefSelect resource={field.ref} labelField={field.refLabel || 'name'} placeholder={field.placeholder} />;
    case 'array':
      return <ArrayEditor itemFields={field.itemFields || []} addLabel={field.addLabel} />;
    case 'text':
    default:
      return <Input placeholder={field.placeholder} />;
  }
}

// Renders one Form.Item from a field config.
export default function DynamicField({ field }) {
  const valuePropName = field.type === 'boolean' ? 'checked' : undefined;
  const rules = field.required ? [{ required: true, message: `${field.label} is required` }] : undefined;

  return (
    <Form.Item
      name={field.name}
      label={field.label}
      rules={rules}
      valuePropName={valuePropName}
      tooltip={field.help}
    >
      {control(field)}
    </Form.Item>
  );
}
