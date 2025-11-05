import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, message } from 'antd'
import { useAuth } from '@/hooks'
import { authApi } from '@/api/endpoints/auth'
import Cookies from 'js-cookie'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuthData } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token')
      const error = searchParams.get('error')

      if (error) {
        message.error(`Authentication failed: ${error}`)
        navigate('/login')
        return
      }

      if (token) {
        // Set token in cookies
        Cookies.set('token', token, { expires: 7 })

        // Fetch user data
        try {
          const response = await authApi.getCurrentUser()
          if (response?.data?.user) {
            const { isAdmin, ...userData } = response.data.user
            setAuthData({ user: userData, isAdmin })
            message.success('Successfully authenticated!')
            navigate('/dashboard')
          } else {
            throw new Error('No user data received')
          }
        } catch (err) {
          console.error('Error fetching user data:', err)
          message.error('Authentication failed')
          navigate('/login')
        }
        return
      }

      // No token, redirect to login
      navigate('/login')
    }

    handleCallback()
  }, [searchParams, navigate, setAuthData])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-500">Processing authentication...</p>
      </div>
    </div>
  )
}

