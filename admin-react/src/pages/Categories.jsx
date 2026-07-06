import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  Tag,
  Popconfirm,
  App,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/kosh';
import { apiErrorMessage } from '../api/client';

const { Title, Text } = Typography;

export default function Categories() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      position: record.position,
      introduction: record.introduction,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing._id, values);
        message.success('Category updated');
      } else {
        await createCategory(values);
        message.success('Category created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteCategory(record._id);
      message.success('Category deleted');
      load();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Delete failed'));
    }
  };

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: '#', dataIndex: 'position', width: 70, sorter: (a, b) => a.position - b.position },
    {
      title: 'Category',
      dataIndex: 'name',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Sub-categories',
      dataIndex: 'subCategoryCount',
      width: 150,
      render: (n) => <Tag color="purple">{n || 0}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            ghost
            icon={<FolderOpenOutlined />}
            onClick={() => navigate(`/categories/${record._id}/subcategories`)}
          >
            Open
          </Button>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this category?"
            description="All its sub-categories and content will be deleted too."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Kosh Categories
          </Title>
          <Text type="secondary">Top-level groups of the Kosh dictionary</Text>
        </div>
      }
      extra={
        <Space wrap>
          <Input.Search
            placeholder="Search categories"
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={load} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Category
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 700 }}
      />

      <Modal
        title={editing ? 'Edit Category' : 'Add Category'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editing ? 'Update' : 'Create'}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>
          <Form.Item name="position" label="Position" tooltip="Order in lists (leave blank to auto-assign)">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Auto" />
          </Form.Item>
          <Form.Item name="introduction" label="Introduction">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
