import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { api } from '../lib/api'
import amsarLogo from '../assets/icon.ico?url'
import loginBg from '../assets/asmr.jpg'

const HIGHLIGHTS = [
  'Monitoring progres & RAB proyek real-time',
  'Pipeline sales funnel dan kunjungan customer',
  'Absensi berbasis GPS & laporan engineer',
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const passwordRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const password = passwordRef.current?.value || ''

    try {
      const res = await api.login({
        email: email.trim(),
        password,
      })
      setAuth(res.token, res.user)
      if (passwordRef.current) {
        passwordRef.current.value = ''
      }

      const redirectRole = String(res.user.role || '').toLowerCase()
      if (redirectRole === 'sales_manager') {
        navigate('/manager/dashboard')
      } else if (redirectRole === 'sales') {
        navigate('/sales/dashboard')
      } else if (redirectRole === 'site_manager') {
        navigate('/site/dashboard')
      } else if (redirectRole === 'engineer') {
        navigate('/engineer/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Email atau password salah')
    } finally {
      if (passwordRef.current) {
        passwordRef.current.value = ''
      }
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f2e1c]">
      {/* Background photo: source is low-res, so it's blurred + tinted on purpose */}
      <img
        src={loginBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-[6px]"
        style={{ objectPosition: 'center 85%' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 85% 15%, rgba(222,22,140,0.22), transparent 55%),' +
            'linear-gradient(135deg, rgba(10,38,22,0.92) 0%, rgba(35,112,67,0.6) 50%, rgba(10,38,22,0.9) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center gap-16 px-4 py-10 lg:justify-between lg:px-8">
        {/* Brand panel (desktop only) */}
        <div className="hidden max-w-lg text-white lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#de168c]" />
            Internal Dashboard
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-tight">
            Kelola proyek &amp; penjualan<br />dalam satu dashboard.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/75">
            Sistem monitoring terpadu PT Amsar Prima Mandiri untuk tim proyek, sales, dan manajemen.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-[#a4ca9a]" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/40 bg-[#f3faf1]/95 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-10">
          <div className="mb-8 flex flex-col items-center">
            <img
              src={amsarLogo}
              alt="PT Amsar"
              className="mb-3"
              style={{ width: 60, height: 60, objectFit: 'contain' }}
            />
            <h1 className="text-xl font-bold text-[#237043]">PT AMSAR PRIMA MANDIRI</h1>
            <p className="text-sm text-[#de168c]">Dashboard Monitoring Proyek</p>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#237043]">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#a4ca9a] bg-[#b7cdc0]/20 px-4 py-2.5 text-sm text-[#237043] placeholder:text-[#5a9844] focus:border-[#de168c] focus:outline-none focus:ring-2 focus:ring-[#de168c]/35"
                placeholder="nama@ptamsar.co.id"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#237043]">Password</label>
              <input
                ref={passwordRef}
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-[#a4ca9a] bg-[#b7cdc0]/20 px-4 py-2.5 text-sm text-[#237043] placeholder:text-[#5a9844] focus:border-[#de168c] focus:outline-none focus:ring-2 focus:ring-[#de168c]/35"
                placeholder="Password Anda"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#237043] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a9844] disabled:opacity-60"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
  
          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm font-medium text-[#de168c] hover:underline">
              Lupa password?
            </Link>
          </div>
  
          <p className="mt-8 text-center text-xs text-[#5a9844]">
            © {new Date().getFullYear()} PT Amsar Prima Mandiri
          </p>
        </div>
      </div>
    </div>
  )
}
