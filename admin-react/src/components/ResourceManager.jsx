import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Typography,
  Tag,
  Popconfirm,
  App,
  Tooltip,
  Image,
  Input,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  FolderOpenOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  listResource,
  createResource,
  updateResource,
  deleteResource,
  getSingleton,
  saveSingleton,
  runAction,
} from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { getResourceConfig } from '../config/resources.js';
import DynamicField from './DynamicField.jsx';

const { Title, Text } = Typography;

const DATE_TYPES = new Set(['date', 'datetime']);
const HEAVY_TYPES = new Set(['richtext', 'images', 'array', 'textarea']);

function truncate(str, n = 80) {
  const s = String(str ?? '');
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function stripHtml(html) {
  return String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function ResourceManager() {
  const { resource } = useParams();
  const config = getResourceConfig(resource);
  const [searchParams] = useSearchParams();
  const parent = searchParams.get('parent') || undefined;
  const parentLabel = searchParams.get('pl') || undefined;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [singletonDoc, setSingletonDoc] = useState(null);
  // Values applied to the drawer form once it's actually mounted (see afterOpenChange).
  const [formInit, setFormInit] = useState({});

  const isSingleton = !!config?.singleton;
  const parentField = config?.parent?.field;

  // ---------- Data loading ----------
  const loadList = useCallback(
    async (page = 1, searchTerm = search) => {
      setLoading(true);
      try {
        const data = await listResource(resource, {
          page,
          limit: pagination.pageSize,
          search: searchTerm || undefined,
          parent,
        });
        setItems(data.items || []);
        setPagination((p) => ({ ...p, current: data.currentPage || page, total: data.total || 0 }));
      } catch (err) {
        message.error(apiErrorMessage(err, 'Failed to load data'));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resource, parent, pagination.pageSize]
  );

  const loadSingleton = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSingleton(resource);
      setSingletonDoc(data.item || null);
      form.setFieldsValue(hydrate(data.item || {}, config.fields));
    } catch (err) {
      message.error(apiErrorMessage(err, 'Failed to load'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  useEffect(() => {
    setSearch('');
    if (!config) return;
    if (isSingleton) loadSingleton();
    else loadList(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, parent]);

  // ---------- Value hydration / serialization ----------
  function hydrate(record, fields) {
    const out = { ...record };
    (fields || []).forEach((f) => {
      if (DATE_TYPES.has(f.type) && record[f.name]) out[f.name] = dayjs(record[f.name]);
      // Populated refs arrive as objects; the Select needs the id.
      if (f.type === 'ref' && record[f.name] && typeof record[f.name] === 'object') {
        out[f.name] = record[f.name]._id;
      }
    });
    return out;
  }

  function serialize(values, fields) {
    const out = { ...values };
    (fields || []).forEach((f) => {
      if (DATE_TYPES.has(f.type) && out[f.name]) {
        out[f.name] = dayjs.isDayjs(out[f.name]) ? out[f.name].toISOString() : out[f.name];
      }
    });
    if (parentField && parent) out[parentField] = parent;
    return out;
  }

  // ---------- Form open ----------
  const visibleFields = useMemo(
    () => (config?.fields || []).filter((f) => f.name !== parentField),
    [config, parentField]
  );

  const openCreate = () => {
    setEditing(null);
    const defaults = {};
    visibleFields.forEach((f) => {
      if (f.type === 'boolean') defaults[f.name] = f.default ?? false;
      if (f.default !== undefined && f.type !== 'boolean') defaults[f.name] = f.default;
    });
    setFormInit(defaults);
    setDrawerOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setFormInit(hydrate(record, config.fields));
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = serialize(values, config.fields);
      if (editing) {
        await updateResource(resource, editing._id, payload);
        message.success('Saved');
      } else {
        await createResource(resource, payload);
        message.success('Created');
      }
      setDrawerOpen(false);
      loadList(pagination.current);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSingletonSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await saveSingleton(resource, serialize(values, config.fields));
      message.success('Saved');
      loadSingleton();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteResource(resource, record._id);
      message.success('Deleted');
      const nextPage = items.length === 1 && pagination.current > 1 ? pagination.current - 1 : pagination.current;
      loadList(nextPage);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Delete failed'));
    }
  };

  const handleAction = async (record, action) => {
    try {
      const res = await runAction(resource, record._id, action.name);
      message.success(res.message || 'Done');
      loadList(pagination.current);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Action failed'));
    }
  };

  // ---------- Cell rendering ----------
  function renderCell(field, value, record) {
    if (value === undefined || value === null || value === '') return <Text type="secondary">—</Text>;
    switch (field.type) {
      case 'boolean':
        return value ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>;
      case 'image':
        return <Image src={value} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} />;
      case 'images':
        return Array.isArray(value) && value.length ? (
          <Image src={value[0]} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <Tag>0</Tag>
        );
      case 'ref':
        return typeof value === 'object' ? value.name || value.title || value.question || value._id : String(value);
      case 'date':
        return dayjs(value).format('YYYY-MM-DD');
      case 'datetime':
        return dayjs(value).format('YYYY-MM-DD HH:mm');
      case 'select':
        return <Tag>{String(value)}</Tag>;
      case 'multiselect':
        return Array.isArray(value) ? value.map((t) => <Tag key={t}>{String(t)}</Tag>) : String(value);
      case 'richtext':
        return truncate(stripHtml(value), 60);
      case 'tags':
        return Array.isArray(value) ? value.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>) : String(value);
      default:
        return truncate(value, 60);
    }
  }

  const columns = useMemo(() => {
    if (!config) return [];
    const fieldByName = Object.fromEntries((config.fields || []).map((f) => [f.name, f]));
    const colDefs = config.columns
      ? config.columns.map((c) => (typeof c === 'string' ? { name: c } : c))
      : (config.fields || []).filter((f) => !HEAVY_TYPES.has(f.type)).slice(0, 5).map((f) => ({ name: f.name }));

    const cols = colDefs.map((c) => {
      const field = fieldByName[c.name] || { name: c.name, type: c.type || 'text', label: c.title || c.name };
      return {
        title: c.title || field.label || c.name,
        dataIndex: c.name,
        key: c.name,
        width: c.width,
        render: (val, record) => renderCell(field, val, record),
      };
    });

    cols.push({
      title: 'Actions',
      key: '__actions',
      fixed: 'right',
      width: (config.children?.length || 0) * 96 + (config.actions?.length || 0) * 44 + 110,
      render: (_, record) => (
        <Space wrap>
          {(config.children || []).map((child) => (
            <Button
              key={child.resource}
              size="small"
              type="primary"
              ghost
              icon={<FolderOpenOutlined />}
              onClick={() =>
                navigate(
                  `/r/${child.resource}?parent=${record._id}&pl=${encodeURIComponent(
                    record[config.childLabelField || 'name'] || child.label
                  )}`
                )
              }
            >
              {child.label}
            </Button>
          ))}
          {(config.actions || []).map((action) => (
            <Popconfirm
              key={action.name}
              title={action.confirm || `Run ${action.label}?`}
              onConfirm={() => handleAction(record, action)}
            >
              <Tooltip title={action.label}>
                <Button size="small" icon={<SendOutlined />} />
              </Tooltip>
            </Popconfirm>
          ))}
          {config.allowEdit !== false && (
            <Tooltip title="Edit">
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
            </Tooltip>
          )}
          <Popconfirm
            title="Delete this item?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    });
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, items, pagination.current]);

  if (!config) {
    return (
      <Card>
        <Text type="danger">Unknown resource: {resource}</Text>
      </Card>
    );
  }

  // ---------- Singleton view ----------
  if (isSingleton) {
    return (
      <Card
        loading={loading && !singletonDoc}
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {config.label}
            </Title>
            {config.description && <Text type="secondary">{config.description}</Text>}
          </div>
        }
        extra={
          <Button type="primary" loading={saving} onClick={handleSingletonSave}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 900 }}>
          <Row gutter={16}>
            {config.fields.map((f) => (
              <Col key={f.name} xs={24} md={f.full ? 24 : f.col || 24}>
                <DynamicField field={f} />
              </Col>
            ))}
          </Row>
        </Form>
      </Card>
    );
  }

  // ---------- List view ----------
  return (
    <>
      <Card
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {config.label}
              {parentLabel ? <Text type="secondary"> — {parentLabel}</Text> : null}
            </Title>
            <Text type="secondary">
              {pagination.total} {config.itemNoun || 'items'}
            </Text>
          </div>
        }
        extra={
          <Space wrap>
            {config.searchable !== false && (
              <Input.Search
                placeholder="Search"
                allowClear
                onSearch={(v) => {
                  setSearch(v);
                  loadList(1, v);
                }}
                style={{ width: 220 }}
              />
            )}
            {parent && (
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                Back
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => loadList(pagination.current)} />
            {config.allowCreate !== false && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Add
              </Button>
            )}
          </Space>
        }
      >
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 'max-content' }}
          expandable={
            config.expandFields
              ? {
                  expandedRowRender: (record) => (
                    <div className="content-html-preview" style={{ maxWidth: 900 }}>
                      {config.expandFields.map((fn) => {
                        const f = config.fields.find((x) => x.name === fn);
                        if (!f || !record[fn]) return null;
                        return (
                          <p key={fn}>
                            <strong>{f.label}: </strong>
                            <span dangerouslySetInnerHTML={{ __html: record[fn] }} />
                          </p>
                        );
                      })}
                    </div>
                  ),
                }
              : undefined
          }
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (t) => `${t} items`,
          }}
          onChange={(pg) => loadList(pg.current)}
        />
      </Card>

      <Drawer
        title={`${editing ? 'Edit' : 'Add'} ${config.singularLabel || config.label}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={Math.min(720, typeof window !== 'undefined' ? window.innerWidth : 720)}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (open) {
            form.resetFields();
            form.setFieldsValue(formInit);
          }
        }}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            {visibleFields.map((f) => (
              <Col key={f.name} xs={24} md={f.col || 24}>
                <DynamicField field={f} />
              </Col>
            ))}
          </Row>
        </Form>
      </Drawer>
    </>
  );
}
