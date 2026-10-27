import { useRef, useState } from 'react'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import { Save, Lock, Camera, Trash2 } from '@icons'
import { getRoleDisplayName } from '../utils/roleUtils'
import UserAvatar from '../components/ui/UserAvatar'
import toast from 'react-hot-toast'

const EMPTY_PW = { current_password: '', new_password: '', new_password_confirmation: '' }
// Mirrors the backend rule: image|mimes:jpg,jpeg,png,webp|max:2048
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const [name, setName] = useState(user?.name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [savingAvatar, setSavingAvatar] = useState(false)
  const fileRef = useRef(null)

  const [pwForm, setPwForm] = useState(EMPTY_PW)
  const [savingPw, setSavingPw] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSavingProfile(true)
    try {
      const res = await api.updateProfile({ name: name.trim() })
      updateUser(res.user)
      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      toast.error(err?.message || 'Gagal memperbarui profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.new_password_confirmation) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    setSavingPw(true)
    try {
      const res = await api.changePassword(pwForm)
      toast.success(res?.message || 'Password berhasil diubah')
      setPwForm(EMPTY_PW)
    } catch (err) {
      toast.error(err?.message || 'Gagal mengubah password')
    } finally {
      setSavingPw(false)
    }
  }

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WEBP')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Ukuran foto maksimal 2 MB')
      return
    }
    setSavingAvatar(true)
    try {
      const res = await api.uploadAvatar(file)
      updateUser(res.user)
      toast.success('Foto profil diperbarui')
    } catch (err) {
      toast.error(err?.message || 'Gagal mengunggah foto')
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    setSavingAvatar(true)
    try {
      const res = await api.deleteAvatar()
      updateUser(res.user)
      toast.success('Foto profil dihapus')
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus foto')
    } finally {
      setSavingAvatar(false)
    }
  }

  const nameChanged = name.trim() !== (user?.name ?? '')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>

      {/* Account info + name edit */}
      <div className="card p-6">
        {/* Avatar + identity */}
        <div className="flex flex-col gap-4 mb-6 pb-5 border-b border-gray-100 sm:flex-row sm:items-center">
          <UserAvatar user={user} className="h-20 w-20 text-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.role && (
              <span className="mt-1 inline-block rounded-full bg-[#237043]/10 px-2.5 py-0.5 text-xs font-medium text-[#237043]">
                {getRoleDisplayName(user.role)}
              </span>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarPick}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={savingAvatar}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Camera size={14} />
                {savingAvatar ? 'Mengunggah...' : user?.avatar_url ? 'Ganti foto' : 'Upload foto'}
              </button>
              {user?.avatar_url && (
                <button
                  type="button"
                  onClick={handleAvatarDelete}
                  disabled={savingAvatar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              )}
              <span className="text-xs text-gray-400">JPG, PNG, atau WEBP · maks. 2 MB</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Informasi Akun</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-1 focus:ring-[#237043]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                value={user?.email ?? ''}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {user?.division && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Divisi</label>
              <input
                value={user.division}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingProfile || !nameChanged}
              className="inline-flex items-center gap-2 rounded-lg bg-[#237043] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a5a35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Ubah Password</h3>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Password Saat Ini <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-1 focus:ring-[#237043]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 karakter"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-1 focus:ring-[#237043]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={pwForm.new_password_confirmation}
                onChange={(e) => setPwForm((f) => ({ ...f, new_password_confirmation: e.target.value }))}
                required
                autoComplete="new-password"
                placeholder="Ulangi password baru"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-1 focus:ring-[#237043]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingPw}
              className="inline-flex items-center gap-2 rounded-lg bg-[#237043] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a5a35] transition-colors disabled:opacity-50"
            >
              <Lock size={14} />
              {savingPw ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
