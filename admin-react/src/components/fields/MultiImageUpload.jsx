import { useState } from 'react';
import { Upload, App, Image, Button, Space } from 'antd';
import { PlusOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import { uploadFile } from '../../api/resources';
import { apiErrorMessage } from '../../api/client';

// Controlled multi-image field. Value is an array of image URLs.
export default function MultiImageUpload({ value = [], onChange }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const urls = Array.isArray(value) ? value : [];

  const handleUpload = async ({ file, onSuccess, onError }) => {
    setLoading(true);
    try {
      const data = await uploadFile(file);
      onChange?.([...urls, data.url]);
      onSuccess?.(data);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Upload failed'));
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const removeAt = (idx) => onChange?.(urls.filter((_, i) => i !== idx));

  return (
    <div>
      <Space wrap>
        {urls.map((url, idx) => (
          <div key={url + idx} style={{ position: 'relative' }}>
            <Image
              src={url}
              width={90}
              height={90}
              style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
            />
            <Button
              size="small"
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={() => removeAt(idx)}
              style={{ position: 'absolute', top: -8, right: -8 }}
            />
          </div>
        ))}
        <Upload showUploadList={false} accept="image/*" customRequest={handleUpload}>
          <div
            style={{
              width: 90,
              height: 90,
              border: '1px dashed #bbb',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#888',
            }}
          >
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <span style={{ fontSize: 12, marginTop: 4 }}>Add</span>
          </div>
        </Upload>
      </Space>
    </div>
  );
}
