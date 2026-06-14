import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/store/toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string })?.from || '/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.warning('请输入用户名和密码')
      return
    }
    try {
      await login({ username, password })
      toast.success('登录成功')
    } catch {
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-hover overflow-hidden flex flex-col md:flex-row">
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 p-12 flex-col justify-between">
          <div className="absolute inset-0 bg-noise" />
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                  <path d="M12 22V12" />
                  <path d="M2 7l10 5 10-5" />
                </svg>
              </div>
              <span className="text-white font-serif text-xl font-semibold tracking-wide">
                慧殡通
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <h1 className="font-serif text-4xl font-bold text-white leading-tight mb-6">
              殡仪馆智能
              <br />
              运营管理系统
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              集接运、防腐、告别、火化、寄存于一体的全流程数字化管理平台，
              以科技之力，彰显人文关怀。
            </p>
          </div>

          <div className="relative z-10 text-white/40 text-sm">
            © 2025 慧殡通 · 让离别更有尊严
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                <path d="M12 22V12" />
                <path d="M2 7l10 5 10-5" />
              </svg>
            </div>
            <span className="font-serif text-lg font-semibold text-primary-800">
              殡仪馆智能运营管理系统
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-slate-800 mb-2">
              欢迎登录
            </h2>
            <p className="text-slate-500 text-sm">
              请输入您的账号信息以访问系统
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="input-field pl-10"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="label-field">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-600">记住我</span>
              </label>
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700 transition-colors">
                忘记密码？
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-slate-500 text-xs mb-2">演示账号</p>
              <p className="text-slate-700 text-sm font-mono">
                用户名：<span className="text-primary-700 font-semibold">admin</span>
                <span className="mx-2 text-slate-300">/</span>
                密码：<span className="text-primary-700 font-semibold">123456</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
