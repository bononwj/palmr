import { useState, useEffect } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks";
import { authApi } from "@/api/endpoints/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { setAuthData, isAuthenticated } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // Map username to emailOrUsername for backend API
      const response = await authApi.login({
        emailOrUsername: values.username,
        password: values.password,
      });
      const loginData = response.data;

      if (loginData.requiresTwoFactor) {
        message.info("Two-factor authentication required");
        // Handle 2FA flow
        return;
      }

      if (loginData.user) {
        const { isAdmin, ...userData } = loginData.user;
        setAuthData({ user: userData, isAdmin });
        message.success(t("auth.loginSuccess"));
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      message.error(error.response?.data?.error || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Palmr Portal</h1>
          <p className="text-gray-500 mt-2">{t("auth.login")}</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("auth.username")}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t("auth.password")}
              size="large"
              visibilityToggle={{
                visible: passwordVisible,
                onVisibleChange: setPasswordVisible,
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              {loading ? t("auth.loggingIn") : t("auth.loginButton")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
