import { useEffect, useMemo, useState } from 'react';
import {
  Table, Button, Space, Tag, Drawer, Form, Input, Select, Switch, DatePicker,
  Popconfirm, App, Card, Typography, Divider, Tooltip, Radio, Empty, Alert,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SaveOutlined,
  ArrowUpOutlined, ArrowDownOutlined, PictureOutlined, NotificationOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  listAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement,
  toggleAdvertisement, getPlacements,
} from '../api/advertisements';
import { apiErrorMessage } from '../api/client';
import ImageUpload from '../components/ImageUpload';
import DeepLinkPicker from '../components/DeepLinkPicker';
import { buildDlPayload, dlPayloadFromStored } from '../utils/deepLink';

const { Text } = Typography;

let uid = 0;
const nextKey = () => `s${Date.now()}_${uid += 1}`;

function emptySection() {
  return {
    key: nextKey(), _id: undefined, title: '', subtitle: '', imageUrl: undefined,
    linkType: 'none', actionUrl: '', initialDeepLink: null,
    dl: { payload: {}, complete: false },
  };
}

// Turn a stored section (from the API) into editor state.
function fromStored(s) {
  return {
    key: nextKey(),
    _id: s._id,
    title: s.title || '',
    subtitle: s.subtitle || '',
    imageUrl: s.imageUrl || undefined,
    linkType: s.linkType || 'none',
    actionUrl: s.actionUrl || '',
    initialDeepLink: s.deepLink || null,
    // Pre-fill the dl_* payload from the stored deep link so an untouched
    // picker keeps the link on save.
    dl: { payload: dlPayloadFromStored(s.deepLink), complete: !!s.deepLink?.contentId },
  };
}

function SectionEditor({ section, index, count, onChange, onRemove, onMove }) {
  const set = (patch) => onChange({ ...section, ...patch });
  return (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      title={<Space><PictureOutlined /> Section {index + 1}{section.title ? ` · ${section.title}` : ''}</Space>}
      extra={
        <Space size={4}>
          <Tooltip title="Move up">
            <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => onMove(index, -1)} />
          </Tooltip>
          <Tooltip title="Move down">
            <Button size="small" icon={<ArrowDownOutlined />} disabled={index === count - 1} onClick={() => onMove(index, 1)} />
          </Tooltip>
          <Popconfirm title="Remove this section?" onConfirm={onRemove}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      }
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Banner image</Text>
          <div><ImageUpload value={section.imageUrl} onChange={(url) => set({ imageUrl: url })} /></div>
        </div>
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Title</Text>
          <Input
            value={section.title}
            maxLength={120}
            placeholder="Section title (optional)"
            onChange={(e) => set({ title: e.target.value })}
            style={{ marginBottom: 8 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>Subtitle</Text>
          <Input
            value={section.subtitle}
            maxLength={200}
            placeholder="Short line under the title (optional)"
            onChange={(e) => set({ subtitle: e.target.value })}
          />
        </div>
      </div>

      <Divider plain style={{ margin: '12px 0 8px' }}>On tap</Divider>
      <Radio.Group
        value={section.linkType}
        onChange={(e) => set({ linkType: e.target.value })}
        optionType="button"
        buttonStyle="solid"
        size="small"
        options={[
          { value: 'content', label: 'Open app content' },
          { value: 'url', label: 'Open URL' },
          { value: 'none', label: 'Nothing' },
        ]}
        style={{ marginBottom: 10 }}
      />

      {section.linkType === 'content' && (
        <DeepLinkPicker
          initialDeepLink={section.initialDeepLink}
          onChange={(v) => set({ dl: { payload: buildDlPayload(v.section, v.selections), complete: v.complete } })}
        />
      )}
      {section.linkType === 'url' && (
        <Input
          value={section.actionUrl}
          placeholder="https://…"
          onChange={(e) => set({ actionUrl: e.target.value })}
        />
      )}
    </Card>
  );
}

export default function Advertisements() {
  const { message } = App.useApp();
  const [data, setData] = useState({ items: [], total: 0, currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [placements, setPlacements] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [formInit, setFormInit] = useState({});
  const [sections, setSections] = useState([]);

  const loadPlacements = () => getPlacements().then((r) => setPlacements(r.placements || [])).catch(() => {});

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAdvertisements({ page, limit: 15, search: search || undefined });
      setData(res);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Failed to load advertisements'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);
  useEffect(() => { loadPlacements(); }, []);

  // Group placements for the select; a placement taken by ANOTHER ad is disabled.
  const placementOptions = useMemo(() => {
    const groups = new Map();
    placements.forEach((p) => {
      const takenByOther = p.taken && (!editing || String(p.adId) !== String(editing._id));
      const opt = {
        value: p.key,
        label: takenByOther ? `${p.label}  (used by "${p.adTitle}")` : p.label,
        disabled: takenByOther,
      };
      if (!groups.has(p.group)) groups.set(p.group, []);
      groups.get(p.group).push(opt);
    });
    return Array.from(groups.entries()).map(([label, options]) => ({ label, options }));
  }, [placements, editing]);

  const freeCount = placements.filter((p) => !p.taken).length;

  const openCreate = () => {
    setEditing(null);
    setSections([emptySection()]);
    setFormInit({ isActive: true });
    setDrawerOpen(true);
    loadPlacements();
  };

  const openEdit = (record) => {
    setEditing(record);
    setSections((record.sections || []).map(fromStored));
    setFormInit({
      placement: record.placement,
      title: record.title,
      isActive: record.isActive !== false,
      startsAt: record.startsAt ? dayjs(record.startsAt) : null,
      endsAt: record.endsAt ? dayjs(record.endsAt) : null,
    });
    setDrawerOpen(true);
    loadPlacements();
  };

  const updateSection = (idx, next) => setSections((prev) => prev.map((s, i) => (i === idx ? next : s)));
  const removeSection = (idx) => setSections((prev) => prev.filter((_, i) => i !== idx));
  const moveSection = (idx, dir) => setSections((prev) => {
    const next = [...prev];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return prev;
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });

  const submit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (!sections.length) {
      message.error('Add at least one section');
      return;
    }
    for (let i = 0; i < sections.length; i += 1) {
      const s = sections[i];
      if (!s.imageUrl && !s.title) {
        message.error(`Section ${i + 1}: add an image or a title`);
        return;
      }
      if (s.linkType === 'content' && !s.dl.complete) {
        message.error(`Section ${i + 1}: pick the content to open, or change "On tap"`);
        return;
      }
      if (s.linkType === 'url' && !s.actionUrl) {
        message.error(`Section ${i + 1}: enter the URL to open`);
        return;
      }
    }

    const payload = {
      placement: values.placement,
      title: values.title,
      isActive: values.isActive,
      startsAt: values.startsAt ? values.startsAt.toISOString() : null,
      endsAt: values.endsAt ? values.endsAt.toISOString() : null,
      sections: sections.map((s) => ({
        _id: s._id,
        title: s.title,
        subtitle: s.subtitle,
        imageUrl: s.imageUrl || null,
        linkType: s.linkType,
        actionUrl: s.linkType === 'url' ? s.actionUrl : null,
        ...(s.linkType === 'content' ? s.dl.payload : {}),
      })),
    };

    setSaving(true);
    try {
      if (editing) await updateAdvertisement(editing._id, payload);
      else await createAdvertisement(payload);
      message.success(editing ? 'Advertisement updated' : 'Advertisement created');
      setDrawerOpen(false);
      load();
      loadPlacements();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const doToggle = async (record) => {
    try {
      await toggleAdvertisement(record._id);
      load();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Toggle failed'));
    }
  };

  const doDelete = async (record) => {
    try {
      await deleteAdvertisement(record._id);
      message.success('Deleted');
      load();
      loadPlacements();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Delete failed'));
    }
  };

  const columns = [
    {
      title: 'Placement', dataIndex: 'placementLabel', width: 220,
      render: (v, r) => (
        <div>
          <Tag color={r.placementType === 'kosh_sub' ? 'purple' : 'geekblue'}>{r.placementType === 'kosh_sub' ? 'Kosh' : v}</Tag>
          {r.placementType === 'kosh_sub' && <div style={{ fontSize: 12 }}>{v}</div>}
        </div>
      ),
    },
    { title: 'Title', dataIndex: 'title', render: (t) => <span style={{ fontWeight: 600 }}>{t}</span> },
    {
      title: 'Sections', dataIndex: 'sections', width: 220,
      render: (secs = []) => (
        <Space size={4} wrap>
          {secs.length === 0 && <Text type="secondary">—</Text>}
          {secs.map((s, i) => (
            <Tooltip key={s._id || i} title={s.title || s.deepLink?.contentTitle || s.actionUrl || 'Section'}>
              <Tag color={s.linkType === 'content' ? 'green' : s.linkType === 'url' ? 'orange' : 'default'}>
                {s.linkType === 'content' ? s.deepLink?.contentType : s.linkType}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: 'Window', width: 190,
      render: (_, r) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {r.startsAt ? dayjs(r.startsAt).format('DD MMM YY') : 'now'} → {r.endsAt ? dayjs(r.endsAt).format('DD MMM YY') : 'no end'}
        </Text>
      ),
    },
    {
      title: 'Views', dataIndex: 'impressionCount', width: 80,
      render: (v) => <Text type="secondary">{v || 0}</Text>,
    },
    {
      title: 'Active', dataIndex: 'isActive', width: 80,
      render: (v, r) => <Switch checked={!!v} size="small" onChange={() => doToggle(r)} />,
    },
    {
      title: 'Actions', width: 110, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Delete this advertisement?" onConfirm={() => doDelete(r)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<Space><NotificationOutlined /> Advertisements</Space>}
      extra={
        <Space>
          <Input.Search
            placeholder="Search title / placement"
            allowClear
            style={{ width: 220 }}
            onSearch={(v) => { setSearch(v); setPage(1); setTimeout(load, 0); }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => { load(); loadPlacements(); }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Advertisement</Button>
        </Space>
      }
    >
      {placements.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={`One advertisement per placement. ${placements.length - freeCount} of ${placements.length} placements in use.`}
        />
      )}
      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={data.items}
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          total: data.total,
          pageSize: 15,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />

      <Drawer
        title={editing ? 'Edit Advertisement' : 'New Advertisement'}
        width={640}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        afterOpenChange={(open) => {
          if (open) {
            form.resetFields();
            form.setFieldsValue(formInit);
          }
        }}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={submit}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="placement" label="Placement (where it shows)" rules={[{ required: true, message: 'Pick a placement' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Kundli, Panchang, a Kosh sub category…"
              options={placementOptions}
            />
          </Form.Item>
          <Form.Item name="title" label="Advertisement name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Internal name, e.g. Diwali Kosh promo" maxLength={120} />
          </Form.Item>

          <Divider orientation="left" plain>Sections (shown in order)</Divider>
          {sections.length === 0 && <Empty description="No sections yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          {sections.map((s, i) => (
            <SectionEditor
              key={s.key}
              section={s}
              index={i}
              count={sections.length}
              onChange={(next) => updateSection(i, next)}
              onRemove={() => removeSection(i)}
              onMove={moveSection}
            />
          ))}
          <Button block type="dashed" icon={<PlusOutlined />} onClick={() => setSections((p) => [...p, emptySection()])}>
            Add section
          </Button>

          <Divider orientation="left" plain>Scheduling</Divider>
          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="startsAt" label="Starts at (optional)" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endsAt" label="Ends at (optional)" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
}
