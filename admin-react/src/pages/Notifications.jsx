import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Tag, Drawer, Form, Input, Select, Switch, DatePicker,
  Popconfirm, App, Card, Typography, Divider, Tooltip,
} from 'antd';
import {
  PlusOutlined, SendOutlined, EditOutlined, DeleteOutlined, BellOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  listNotifications, createNotification, updateNotification, deleteNotification,
  toggleNotification, resendNotification, getSections,
} from '../api/notifications';
import { apiErrorMessage } from '../api/client';
import RichText from '../components/RichText';
import ImageUpload from '../components/ImageUpload';
import DeepLinkPicker from '../components/DeepLinkPicker';
import { buildDlPayload } from '../utils/deepLink';

const { Text } = Typography;

const TYPE_OPTIONS = ['info', 'content', 'promotion', 'alert', 'update'].map((v) => ({ value: v, label: v }));
const PRIORITY_OPTIONS = ['low', 'medium', 'high'].map((v) => ({ value: v, label: v }));
const AUDIENCE_OPTIONS = ['all', 'free', 'premium'].map((v) => ({ value: v, label: v }));

export default function Notifications() {
  const { message } = App.useApp();
  const [data, setData] = useState({ items: [], total: 0, currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState();
  const [sections, setSections] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [formInit, setFormInit] = useState({});
  // Deep-link payload assembled by the picker (dl_* fields) + completeness flag.
  const [deepLink, setDeepLink] = useState({ payload: {}, complete: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await listNotifications({ page, limit: 15, search: search || undefined, section: sectionFilter || undefined });
      setData(res);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, sectionFilter]);
  useEffect(() => { getSections().then((r) => setSections(r.sections || [])).catch(() => {}); }, []);

  const openCreate = () => {
    setEditing(null);
    setDeepLink({ payload: {}, complete: false });
    setFormInit({ type: 'info', priority: 'medium', targetAudience: 'all', isActive: true });
    setDrawerOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setDeepLink({ payload: {}, complete: !!record.deepLink });
    setFormInit({
      title: record.title,
      message: record.message,
      type: record.type || 'info',
      priority: record.priority || 'medium',
      targetAudience: record.targetAudience || 'all',
      isActive: record.isActive !== false,
      imageUrl: record.imageUrl || undefined,
      scheduledAt: record.scheduledAt ? dayjs(record.scheduledAt) : null,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null,
    });
    setDrawerOpen(true);
  };

  const onDeepLinkChange = ({ payload, complete }) => setDeepLink({ payload: payload || {}, complete });

  const submit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const payload = {
      ...values,
      scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined,
      expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
      ...deepLink.payload,
    };
    setSaving(true);
    try {
      const res = editing
        ? await updateNotification(editing._id, payload)
        : await createNotification(payload);
      const sent = res?.push?.sent;
      message.success(
        `${editing ? 'Updated' : 'Created'}${sent ? ' & push sent to all users' : ' (push not sent)'}`,
      );
      setDrawerOpen(false);
      load();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const doToggle = async (record) => {
    try {
      await toggleNotification(record._id);
      load();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Toggle failed'));
    }
  };

  const doResend = async (record) => {
    try {
      const res = await resendNotification(record._id);
      message.success(res?.push?.sent ? 'Resent to all users' : 'Resend attempted (push not sent)');
    } catch (err) {
      message.error(apiErrorMessage(err, 'Resend failed'));
    }
  };

  const doDelete = async (record) => {
    try {
      await deleteNotification(record._id);
      message.success('Deleted');
      load();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Delete failed'));
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{t}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <span dangerouslySetInnerHTML={{ __html: (r.message || '').slice(0, 80) }} />
          </Text>
        </div>
      ),
    },
    { title: 'Type', dataIndex: 'type', width: 90, render: (v) => <Tag>{v}</Tag> },
    {
      title: 'Priority', dataIndex: 'priority', width: 90,
      render: (v) => <Tag color={v === 'high' ? 'red' : v === 'low' ? 'default' : 'blue'}>{v}</Tag>,
    },
    {
      title: 'Deep link', dataIndex: 'deepLink', width: 130,
      render: (dl) => (dl?.contentType ? <Tag color="purple">{dl.contentType}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Active', dataIndex: 'isActive', width: 80,
      render: (v, r) => <Switch checked={!!v} size="small" onChange={() => doToggle(r)} />,
    },
    {
      title: 'Sent', dataIndex: 'createdAt', width: 120,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v ? dayjs(v).format('DD MMM, HH:mm') : ''}</Text>,
    },
    {
      title: 'Actions', width: 150, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="Resend push">
            <Button size="small" icon={<SendOutlined />} onClick={() => doResend(r)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Delete this notification?" onConfirm={() => doDelete(r)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<Space><BellOutlined /> Notifications</Space>}
      extra={
        <Space>
          <Input.Search
            placeholder="Search title/message"
            allowClear
            style={{ width: 220 }}
            onSearch={(v) => { setSearch(v); setPage(1); setTimeout(load, 0); }}
          />
          <Select
            allowClear
            placeholder="Filter section"
            style={{ width: 180 }}
            value={sectionFilter}
            onChange={(v) => { setSectionFilter(v); setPage(1); }}
            options={sections.map((s) => ({ value: s.key, label: s.label }))}
          />
          <Button icon={<ReloadOutlined />} onClick={load} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Notification</Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={data.items}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          total: data.total,
          pageSize: 15,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />

      <Drawer
        title={editing ? 'Edit Notification' : 'Send New Notification'}
        width={560}
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
            <Button type="primary" icon={<SendOutlined />} loading={saving} onClick={submit}>
              {editing ? 'Save & Resend' : 'Send Notification'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="Notification title" maxLength={120} />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Message is required' }]}>
            <RichText placeholder="Notification body" />
          </Form.Item>

          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="type" label="Type" style={{ flex: 1 }}>
              <Select options={TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="priority" label="Priority" style={{ flex: 1 }}>
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>
            <Form.Item name="targetAudience" label="Audience" style={{ flex: 1 }}>
              <Select options={AUDIENCE_OPTIONS} />
            </Form.Item>
          </Space>

          <Form.Item name="imageUrl" label="Image (optional)">
            <ImageUpload />
          </Form.Item>

          <Divider orientation="left" plain>Deep link (open specific content on tap)</Divider>
          <DeepLinkPicker
            initialDeepLink={editing?.deepLink}
            onChange={(v) => onDeepLinkChange({ payload: buildDlPayload(v.section, v.selections), complete: v.complete })}
          />

          <Divider orientation="left" plain>Scheduling</Divider>
          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="scheduledAt" label="Scheduled at" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="expiresAt" label="Expires at" style={{ flex: 1 }}>
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
