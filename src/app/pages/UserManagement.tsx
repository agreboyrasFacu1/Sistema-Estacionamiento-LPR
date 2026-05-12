import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  X,
  Save,
  Eye,
  EyeOff,
  Search,
  UserCog,
} from 'lucide-react';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

const emptyForm: UserFormData = {
  name: '',
  email: '',
  role: 'cashier',
  password: '',
};

export const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserActive } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<UserFormData> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.email.trim()) newErrors.email = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Correo inválido';
    else if (!editingUser && users.some((u) => u.email === formData.email)) newErrors.email = 'Este correo ya existe';
    if (!editingUser && !formData.password) newErrors.password = 'La contraseña es requerida';
    if (!editingUser && formData.password && formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
    setErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!validate()) return;

    if (editingUser) {
      updateUser(
        { ...editingUser, name: formData.name, email: formData.email, role: formData.role },
        formData.password || undefined
      );
    } else {
      addUser(formData);
    }

    setShowModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleToggleActive = (userId: string) => {
    toggleUserActive(userId);
  };

  const handleDelete = (userId: string) => {
    deleteUser(userId);
    setDeleteConfirm(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Success Toast */}
      {savedSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Cambios guardados exitosamente</span>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">¿Eliminar Usuario?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="font-bold text-gray-900">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: undefined }); }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Juan Pérez"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="juan@estacionamiento.com"
                  disabled={!!editingUser}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                {editingUser && <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar</p>}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol del Usuario
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'cashier' })}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.role === 'cashier'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-0.5">Cajero</div>
                    <div className="text-xs text-gray-500">Ingreso, salida, búsqueda</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.role === 'admin'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-gray-900 mb-0.5">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      Administrador
                    </div>
                    <div className="text-xs text-gray-500">Acceso total al sistema</div>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors({ ...errors, password: undefined }); }}
                    className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder={editingUser ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
              </div>

              {/* Permissions summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-2">Permisos del rol seleccionado:</p>
                <div className="space-y-1">
                  {[
                    { label: 'Ingreso y salida de vehículos', both: true },
                    { label: 'Búsqueda manual', both: true },
                    { label: 'Panel de administración', both: false },
                    { label: 'Gestión de usuarios', both: false },
                    { label: 'Gestión de tarifas', both: false },
                    { label: 'Gestión de abonados', both: false },
                  ].map((perm) => (
                    <div key={perm.label} className="flex items-center gap-2 text-xs">
                      {perm.both || formData.role === 'admin' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-300" />
                      )}
                      <span className={perm.both || formData.role === 'admin' ? 'text-gray-700' : 'text-gray-400'}>
                        {perm.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Usuarios</h1>
        <p className="text-gray-500">Administrar usuarios del sistema y sus permisos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-sm text-gray-500">Total de Usuarios</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{users.filter((u) => u.isActive).length}</div>
              <div className="text-sm text-gray-500">Usuarios Activos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{users.filter((u) => u.role === 'admin').length}</div>
              <div className="text-sm text-gray-500">Administradores</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm ml-4"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Creado</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3" />}
                      {user.role === 'admin' ? 'Administrador' : 'Cajero'}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          Activo
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-5 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
