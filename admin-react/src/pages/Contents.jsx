import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  InputNumber,
  Typography,
  Tag,
  Switch,
  Popconfirm,
  Breadcrumb,
  App,
  Tooltip,
  Image,
  Row,
  Col,
  Upload,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  YoutubeFilled,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import {
  getContents,
  createContent,
  updateContent,
  deleteContent,
  downloadContentTemplate,
  exportContentExcel,
  importContentExcel,
} from '../api/kosh';
import { apiErrorMessage } from '../api/client';
import RichText from '../components/RichText.jsx';
import ImageUpload from '../components/ImageUpload.jsx';

const { Title, Text } = Typography;

export default function Contents() {
  const { subId } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [subcategory, setSubcategory] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState('');
  const [form] = Form.useForm();
  const [formInit, setFormInit] = useState({});
  const [excelBusy, setExcelBusy] = useState(false);

  const load = useCallback(
    async (page = pagination.current, searchTerm = search) => {
      setLoading(true);
      try {
        const data = await getContents(subId, {
          page,
          limit: pagination.pageSize,
          search: searchTerm || undefined,
        });
        setSubcategory(data.subcategory || null);
        setContents(data.contents || []);
        setPagination((p) => ({ ...p, current: data.currentPage, total: data.totalContents }));
      } catch (err) {
        message.error(apiErrorMessage(err, 'Failed to load content'));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subId, pagination.pageSize]
  );

  useEffect(() => {
    load(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subId]);

  const openCreate = () => {
    setEditing(null);
    setImage('');
    setFormInit({ payment: false });
    setDrawerOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setImage(record.image || '');
    setFormInit({
      sequenceNo: record.sequenceNo,
      hindiWord: record.hindiWord,
      englishWord: record.englishWord,
      hinglishWord: record.hinglishWord,
      meaning: record.meaning,
      extra: record.extra,
      structure: record.structure,
      search: record.search,
      youtubeLink: record.youtubeLink,
      payment: !!record.payment,
      amount: record.amount || 0,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = { ...values, image };
      if (editing) {
        await updateContent(editing._id, payload);
        message.success('Content updated');
      } else {
        await createContent({ ...payload, subCategory: subId });
        message.success('Content created');
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      message.error(apiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteContent(record._id);
      message.success('Content deleted');
      const nextPage =
        contents.length === 1 && pagination.current > 1 ? pagination.current - 1 : pagination.current;
      load(nextPage);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Delete failed'));
    }
  };

  const onSearch = (value) => {
    setSearch(value);
    load(1, value);
  };

  const handleTemplate = async () => {
    try {
      await downloadContentTemplate(subId);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Could not download template'));
    }
  };

  const handleExport = async () => {
    setExcelBusy(true);
    try {
      await exportContentExcel(subId);
      message.success('Exported to Excel');
    } catch (err) {
      message.error(apiErrorMessage(err, 'Export failed'));
    } finally {
      setExcelBusy(false);
    }
  };

  const handleImport = async (file) => {
    setExcelBusy(true);
    try {
      const res = await importContentExcel(subId, file);
      if (res.errors && res.errors.length) {
        Modal.warning({
          title: `Imported ${res.imported} of ${res.total} rows`,
          content: (
            <div>
              <p>{res.skipped} row(s) were skipped:</p>
              <ul style={{ paddingLeft: 18 }}>
                {res.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          ),
        });
      } else {
        message.success(`Imported ${res.imported} record(s)`);
      }
      load(1, '');
    } catch (err) {
      message.error(apiErrorMessage(err, 'Import failed'));
    } finally {
      setExcelBusy(false);
    }
    return false; // prevent antd Upload's default request
  };

  const columns = [
    { title: 'Seq', dataIndex: 'sequenceNo', width: 70 },
    {
      title: 'Image',
      dataIndex: 'image',
      width: 80,
      render: (src) =>
        src ? (
          <Image src={src} width={44} height={44} style={{ objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <Tag>None</Tag>
        ),
    },
    { title: 'Hindi', dataIndex: 'hindiWord', render: (v) => <strong>{v}</strong> },
    { title: 'English', dataIndex: 'englishWord' },
    { title: 'Hinglish', dataIndex: 'hinglishWord' },
    {
      title: 'Payment',
      dataIndex: 'payment',
      width: 120,
      render: (v, r) =>
        v ? <Tag color="green">₹{r.amount || 0}</Tag> : <Tag color="default">No</Tag>,
    },
    {
      title: 'Video',
      dataIndex: 'youtubeLink',
      width: 70,
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noreferrer">
            <YoutubeFilled style={{ color: '#ff0000', fontSize: 20 }} />
          </a>
        ) : null,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm title="Delete this content?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record)}>
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
          {
            title: subcategory?.parentCategory ? (
              <a onClick={() => navigate(`/categories/${subcategory.parentCategory}/subcategories`)}>
                Sub-categories
              </a>
            ) : (
              'Sub-categories'
            ),
          },
          { title: subcategory?.name || '...' },
        ]}
      />
      <Card
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {subcategory?.name || 'Content'}
            </Title>
            <Text type="secondary">{pagination.total} entries</Text>
          </div>
        }
        extra={
          <Space wrap>
            <Input.Search
              placeholder="Search words / meaning"
              allowClear
              onSearch={onSearch}
              style={{ width: 220 }}
            />
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() =>
                subcategory?.parentCategory
                  ? navigate(`/categories/${subcategory.parentCategory}/subcategories`)
                  : navigate('/categories')
              }
            >
              Back
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => load()} />
            <Tooltip title="Download a blank Excel template">
              <Button icon={<FileExcelOutlined />} onClick={handleTemplate}>
                Template
              </Button>
            </Tooltip>
            <Button icon={<DownloadOutlined />} loading={excelBusy} onClick={handleExport}>
              Export
            </Button>
            <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={handleImport}>
              <Button icon={<UploadOutlined />} loading={excelBusy}>
                Import
              </Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Content
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={contents}
          scroll={{ x: 900 }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="content-html-preview" style={{ maxWidth: 900 }}>
                {record.meaning && (
                  <p>
                    <strong>Meaning: </strong>
                    <span dangerouslySetInnerHTML={{ __html: record.meaning }} />
                  </p>
                )}
                {record.extra && (
                  <p>
                    <strong>Extra: </strong>
                    <span dangerouslySetInnerHTML={{ __html: record.extra }} />
                  </p>
                )}
                {record.structure && (
                  <p>
                    <strong>Structure: </strong>
                    <span dangerouslySetInnerHTML={{ __html: record.structure }} />
                  </p>
                )}
                {record.search && (
                  <p>
                    <strong>Search terms: </strong>
                    {record.search}
                  </p>
                )}
              </div>
            ),
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (t) => `${t} items`,
          }}
          onChange={(pg) => load(pg.current)}
        />
      </Card>

      <Drawer
        title={editing ? 'Edit Content' : 'Add Content'}
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
            <Col xs={12} md={8}>
              <Form.Item
                name="sequenceNo"
                label="Sequence No"
                tooltip="Leave blank to auto-assign"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Auto" />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="payment"
                label="Payment"
                valuePropName="checked"
                tooltip="Is this a paid (premium) entry?"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.payment !== cur.payment}
              >
                {({ getFieldValue }) =>
                  getFieldValue('payment') ? (
                    <Form.Item
                      name="amount"
                      label="Amount"
                      tooltip="Price charged for this paid entry"
                      rules={[{ required: true, message: 'Enter an amount' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        addonBefore="₹"
                        placeholder="0"
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="hindiWord" label="Hindi Word">
                <Input placeholder="शब्द" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="englishWord" label="English Word">
                <Input placeholder="word" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="hinglishWord" label="Hinglish Word">
                <Input placeholder="shabd" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="meaning" label="Meaning">
            <RichText placeholder="Meaning..." />
          </Form.Item>
          <Form.Item name="extra" label="Extra">
            <RichText placeholder="Extra details..." />
          </Form.Item>
          <Form.Item name="structure" label="Structure">
            <RichText placeholder="Word structure..." />
          </Form.Item>

          <Form.Item name="search" label="Search Terms" tooltip="Comma-separated keywords">
            <Input placeholder="term1, term2, term3" />
          </Form.Item>
          <Form.Item name="youtubeLink" label="YouTube Link">
            <Input placeholder="https://youtube.com/..." />
          </Form.Item>
          <Form.Item label="Image">
            <ImageUpload value={image} onChange={setImage} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
