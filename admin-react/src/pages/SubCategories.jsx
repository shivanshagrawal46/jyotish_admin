import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Breadcrumb,
  App,
  Tooltip,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from '../api/kosh';
import { apiErrorMessage } from '../api/client';
import ImageUpload from '../components/ImageUpload.jsx';

const { Title, Text } = Typography;

export default function SubCategories() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSubCategories(categoryId);
      setCategory(data.category || null);
      setSubcategories(data.subcategories || []);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Failed to load sub-categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const openCreate = () => {
    setEditing(null);
    setCoverImage('');
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setCoverImage(record.cover_image || '');
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
      const payload = { ...values, cover_image: coverImage };
      if (editing) {
        await updateSubCategory(editing._id, payload);
        message.success('Sub-category updated');
      } else {
        await createSubCategory({ ...payload, parentCategory: categoryId });
        message.success('Sub-category created');
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
      await deleteSubCategory(record._id);
      message.success('Sub-category deleted');
      load();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Delete failed'));
    }
  };

  const columns = [
    { title: '#', dataIndex: 'position', width: 70, sorter: (a, b) => a.position - b.position },
    {
      title: 'Cover',
      dataIndex: 'cover_image',
      width: 90,
      render: (src) =>
        src ? (
          <Image src={src} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <Tag>None</Tag>
        ),
    },
    { title: 'Sub-category', dataIndex: 'name', render: (name) => <strong>{name}</strong> },
    {
      title: 'Content',
      dataIndex: 'contentCount',
      width: 120,
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
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/subcategories/${record._id}/contents`)}
          >
            Content
          </Button>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this sub-category?"
            description="All its content will be deleted too."
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
    <>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate('/categories')}>Categories</a> },
          { title: category?.name || '...' },
        ]}
      />
      <Card
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {category?.name || 'Sub-categories'}
            </Title>
            <Text type="secondary">Sub-categories under this category</Text>
          </div>
        }
        extra={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/categories')}>
              Back
            </Button>
            <Button icon={<ReloadOutlined />} onClick={load} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Sub-category
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={subcategories}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editing ? 'Edit Sub-category' : 'Add Sub-category'}
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
            <Input placeholder="Sub-category name" />
          </Form.Item>
          <Form.Item name="position" label="Position" tooltip="Order in lists (leave blank to auto-assign)">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Auto" />
          </Form.Item>
          <Form.Item name="introduction" label="Introduction">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
          <Form.Item label="Cover Image">
            <ImageUpload value={coverImage} onChange={setCoverImage} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
