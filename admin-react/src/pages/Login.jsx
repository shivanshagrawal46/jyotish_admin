import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Form, Input, Button, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { TOKEN_KEY, apiErrorMessage } from '../api/client';

const { Title, Text } = Typography;

export default function Login() {
  const { login } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/categories" replace />;
  }

  const from = location.state?.from?.pathname || '/categories';

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      message.error(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <BookOutlined />
        </div>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
          Kosh Admin
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 28 }}>
          Sign in to manage Kosh content
        </Text>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
