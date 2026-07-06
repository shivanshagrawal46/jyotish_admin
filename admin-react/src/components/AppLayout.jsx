import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Grid, theme } from 'antd';
import {
  BookOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  ReadOutlined,
  StarOutlined,
  ShoppingOutlined,
  BellOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { menuGroups } from '../config/resources.js';

const GROUP_ICONS = {
  kosh: <BookOutlined />,
  content: <ReadOutlined />,
  horoscope: <StarOutlined />,
  shop: <ShoppingOutlined />,
  engagement: <BellOutlined />,
  emag: <FileTextOutlined />,
  prashan: <ThunderboltOutlined />,
  panchang: <CalendarOutlined />,
  app: <AppstoreOutlined />,
};

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const screens = useBreakpoint();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const isMobile = !screens.md;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const keyToPath = {};
  menuGroups.forEach((g) => g.items.forEach((it) => (keyToPath[it.key] = it.to)));

  const path = location.pathname;
  let selectedKey = 'koshCategories';
  if (path.startsWith('/r/')) selectedKey = path.split('/')[2];
  else if (path.startsWith('/notifications')) selectedKey = 'notifications';
  else if (path.startsWith('/categories') || path.startsWith('/subcategories')) selectedKey = 'koshCategories';

  const openGroup = menuGroups.find((g) => g.items.some((it) => it.key === selectedKey));

  const menuItems = menuGroups.map((g) => ({
    key: g.key,
    icon: GROUP_ICONS[g.key],
    label: g.label,
    children: g.items.map((it) => ({ key: it.key, label: it.label })),
  }));

  const onMenuClick = ({ key }) => {
    if (keyToPath[key]) navigate(keyToPath[key]);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={isMobile ? 0 : 80}
        breakpoint="md"
        trigger={null}
        style={{ background: '#2d3250' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '0 24px' : '0 20px',
            color: '#fff',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#5b3fb3,#7b5fd6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
            }}
          >
            <BookOutlined />
          </div>
          {!collapsed && <span className="brand-title">Kosh Admin</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openGroup ? [openGroup.key] : ['kosh']}
          onClick={onMenuClick}
          style={{ background: 'transparent' }}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown
            menu={{
              items: [
                { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
              ],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Avatar style={{ background: '#5b3fb3' }} icon={<UserOutlined />} />
              {!isMobile && <span style={{ fontWeight: 500 }}>{user?.username || 'Admin'}</span>}
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: isMobile ? 12 : 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
