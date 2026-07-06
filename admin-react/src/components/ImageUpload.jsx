import { useState } from 'react';
import { Upload, App } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { uploadImage } from '../api/kosh';
import { apiErrorMessage } from '../api/client';

// Controlled image uploader. Value is the stored image URL (e.g. /images/x.png).
export default function ImageUpload({ value, onChange }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    setLoading(true);
    try {
      const data = await uploadImage(file);
      onChange?.(data.url);
      onSuccess?.(data);
      message.success('Image uploaded');
    } catch (err) {
      message.error(apiErrorMessage(err, 'Upload failed'));
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Upload
      listType="picture-card"
      showUploadList={false}
      accept="image/*"
      customRequest={handleUpload}
    >
      {value ? (
        <img src={value} alt="upload" style={{ width: '100%', objectFit: 'cover', borderRadius: 8 }} />
      ) : (
        <div>
          {loading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      )}
    </Upload>
  );
}
