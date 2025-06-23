import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set default axios header for authentication
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Auth Context
const AuthContext = React.createContext();

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      logout();
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setAuthToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user: userInfo } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setAuthToken(access_token);
      setUser(userInfo);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <div className="App">
        {user ? <Dashboard /> : <AuthPage />}
      </div>
    </AuthContext.Provider>
  );
}

// Authentication Page
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
    student_id: '',
    department: '',
    year: 1,
    status: 'active',
    specialty: '',
    level: 'L1',
    field_of_study: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = React.useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = isLogin 
      ? await login(formData.email, formData.password)
      : await register(formData);

    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Système de Gestion Universitaire
          </h1>
          <p className="text-blue-200">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="first_name"
                  placeholder="Prénom"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Nom"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                  required
                />
              </div>

              <div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="student" className="bg-gray-800">Étudiant</option>
                  <option value="teacher" className="bg-gray-800">Professeur</option>
                  <option value="admin" className="bg-gray-800">Administrateur</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="student_id"
                      placeholder="ID Étudiant"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                    />
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="L1" className="bg-gray-800">L1</option>
                      <option value="L2" className="bg-gray-800">L2</option>
                      <option value="L3" className="bg-gray-800">L3</option>
                      <option value="M1" className="bg-gray-800">M1</option>
                      <option value="M2" className="bg-gray-800">M2</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    name="field_of_study"
                    placeholder="Filière d'étude"
                    value={formData.field_of_study}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                  />
                </>
              )}

              {formData.role === 'teacher' && (
                <input
                  type="text"
                  name="specialty"
                  placeholder="Spécialité"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                />
              )}

              <div>
                <input
                  type="text"
                  name="department"
                  placeholder="Département"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Téléphone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-300 hover:text-blue-200 transition-colors"
          >
            {isLogin 
              ? "Pas de compte ? S'inscrire" 
              : "Déjà inscrit ? Se connecter"
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [grades, setGrades] = useState([]);
  const [examProposals, setExamProposals] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    department: '',
    level: '',
    field_of_study: '',
    specialty: '',
    exam_type: '',
    day_of_week: '',
    classroom: ''
  });

  useEffect(() => {
    fetchStats();
    fetchCourses();
    fetchSchedules();
    if (user.role === 'student') {
      fetchGrades();
    }
    if (user.role === 'teacher' || user.role === 'admin') {
      fetchExamProposals();
      fetchAttendance();
    }
    if (user.role === 'admin') {
      fetchUsers();
      fetchAllGrades();
    }
  }, [user.role]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.department) params.append('department', filters.department);
      
      const endpoint = user.role === 'admin' ? 'courses' : 'courses/my';
      const response = await axios.get(`${API}/${endpoint}?${params}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.day_of_week) params.append('day_of_week', filters.day_of_week);
      if (filters.classroom) params.append('classroom', filters.classroom);
      
      const response = await axios.get(`${API}/schedules?${params}`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await axios.get(`${API}/grades/my`);
      setGrades(response.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchAllGrades = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.exam_type) params.append('exam_type', filters.exam_type);
      
      const response = await axios.get(`${API}/grades?${params}`);
      setGrades(response.data);
    } catch (error) {
      console.error('Error fetching all grades:', error);
    }
  };

  const fetchExamProposals = async () => {
    try {
      const response = await axios.get(`${API}/exam-proposals`);
      setExamProposals(response.data);
    } catch (error) {
      console.error('Error fetching exam proposals:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`${API}/attendance`);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      if (filters.level) params.append('level', filters.level);
      if (filters.field_of_study) params.append('field_of_study', filters.field_of_study);
      if (filters.specialty) params.append('specialty', filters.specialty);
      
      const response = await axios.get(`${API}/admin/users?${params}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Effect to refetch data when search or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user) {
        fetchCourses();
        fetchSchedules();
        if (user.role === 'admin') {
          fetchUsers();
          fetchAllGrades();
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      return;
    }

    try {
      await axios.delete(`${API}/${type}/${id}`);
      // Refresh the appropriate data
      switch (type) {
        case 'admin/users':
          fetchUsers();
          break;
        case 'courses':
          fetchCourses();
          break;
        case 'schedules':
          fetchSchedules();
          break;
        case 'grades':
          if (user.role === 'admin') {
            fetchAllGrades();
          } else {
            fetchGrades();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent stats={stats} user={user} />;
      case 'users':
        return <UsersManagement 
          users={users} 
          onEdit={(user) => openModal('user', user)}
          onDelete={(id) => handleDelete('admin/users', id)}
          onAdd={() => openModal('user')}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
        />;
      case 'courses':
        return <CoursesContent 
          courses={courses} 
          user={user}
          onEdit={(course) => openModal('course', course)}
          onDelete={(id) => handleDelete('courses', id)}
          onAdd={() => openModal('course')}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
        />;
      case 'schedule':
        return <ScheduleContent 
          schedules={schedules}
          onEdit={(schedule) => openModal('schedule', schedule)}
          onDelete={(id) => handleDelete('schedules', id)}
          onAdd={() => openModal('schedule')}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          user={user}
        />;
      case 'grades':
        return <GradesContent 
          grades={grades}
          user={user}
          onEdit={(grade) => openModal('grade', grade)}
          onDelete={(id) => handleDelete('grades', id)}
          onAdd={() => openModal('grade')}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
        />;
      case 'exams':
        return <ExamProposalsContent examProposals={examProposals} user={user} />;
      case 'attendance':
        return <AttendanceContent attendance={attendance} />;
      default:
        return <DashboardContent stats={stats} user={user} />;
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { key: 'dashboard', label: 'Tableau de bord', icon: '📊' },
      { key: 'courses', label: 'Cours', icon: '📚' },
      { key: 'schedule', label: 'Emploi du temps', icon: '📅' }
    ];

    if (user.role === 'student') {
      return [
        ...baseItems,
        { key: 'grades', label: 'Notes', icon: '📈' }
      ];
    } else if (user.role === 'teacher') {
      return [
        ...baseItems,
        { key: 'grades', label: 'Gestion des notes', icon: '📈' },
        { key: 'exams', label: 'Propositions d\'examens', icon: '📝' },
        { key: 'attendance', label: 'Présences', icon: '✅' }
      ];
    } else if (user.role === 'admin') {
      return [
        ...baseItems,
        { key: 'users', label: 'Gestion utilisateurs', icon: '👥' },
        { key: 'grades', label: 'Gestion des notes', icon: '📈' },
        { key: 'exams', label: 'Gestion examens', icon: '📝' },
        { key: 'attendance', label: 'Présences', icon: '✅' }
      ];
    }

    return baseItems;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            Université - {user.role === 'admin' ? 'Administrateur' : user.role === 'teacher' ? 'Professeur' : 'Étudiant'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-blue-200">
              {user.first_name} {user.last_name}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-black/20 backdrop-blur-lg border-r border-white/10 min-h-screen">
          <div className="p-4">
            {getMenuItems().map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors flex items-center space-x-3 ${
                  activeTab === item.key 
                    ? 'bg-blue-600/50 text-white' 
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <FormModal
          type={modalType}
          item={editingItem}
          onClose={closeModal}
          onSave={() => {
            closeModal();
            // Refresh appropriate data
            switch (modalType) {
              case 'user':
                fetchUsers();
                break;
              case 'course':
                fetchCourses();
                break;
              case 'schedule':
                fetchSchedules();
                break;
              case 'grade':
                if (user.role === 'admin') {
                  fetchAllGrades();
                } else {
                  fetchGrades();
                }
                break;
              default:
                break;
            }
          }}
          user={user}
        />
      )}
    </div>
  );
};

// Search and Filter Component
const SearchAndFilter = ({ 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters, 
  type, 
  user 
}) => {
  const renderFilters = () => {
    switch (type) {
      case 'users':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
            >
              <option value="" className="bg-gray-800">Tous les rôles</option>
              <option value="student" className="bg-gray-800">Étudiants</option>
              <option value="teacher" className="bg-gray-800">Professeurs</option>
              <option value="admin" className="bg-gray-800">Administrateurs</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
            >
              <option value="" className="bg-gray-800">Tous les statuts</option>
              <option value="active" className="bg-gray-800">Actif</option>
              <option value="inactive" className="bg-gray-800">Inactif</option>
              <option value="suspended" className="bg-gray-800">Suspendu</option>
            </select>
            <input
              type="text"
              placeholder="Département"
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-300"
            />
            <select
              value={filters.level}
              onChange={(e) => setFilters({...filters, level: e.target.value})}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
            >
              <option value="" className="bg-gray-800">Tous les niveaux</option>
              <option value="L1" className="bg-gray-800">L1</option>
              <option value="L2" className="bg-gray-800">L2</option>
              <option value="L3" className="bg-gray-800">L3</option>
              <option value="M1" className="bg-gray-800">M1</option>
              <option value="M2" className="bg-gray-800">M2</option>
            </select>
          </div>
        );
      case 'courses':
        return (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Département"
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-300"
            />
          </div>
        );
      case 'schedules':
        return (
          <div className="grid grid-cols-2 gap-4">
            <select
              value={filters.day_of_week}
              onChange={(e) => setFilters({...filters, day_of_week: e.target.value})}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
            >
              <option value="" className="bg-gray-800">Tous les jours</option>
              <option value="Lundi" className="bg-gray-800">Lundi</option>
              <option value="Mardi" className="bg-gray-800">Mardi</option>
              <option value="Mercredi" className="bg-gray-800">Mercredi</option>
              <option value="Jeudi" className="bg-gray-800">Jeudi</option>
              <option value="Vendredi" className="bg-gray-800">Vendredi</option>
            </select>
            <input
              type="text"
              placeholder="Salle"
              value={filters.classroom}
              onChange={(e) => setFilters({...filters, classroom: e.target.value})}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-300"
            />
          </div>
        );
      case 'grades':
        return (
          <div className="grid grid-cols-2 gap-4">
            <select
              value={filters.exam_type}
              onChange={(e) => setFilters({...filters, exam_type: e.target.value})}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
            >
              <option value="" className="bg-gray-800">Tous les types</option>
              <option value="continuous" className="bg-gray-800">Contrôle continu</option>
              <option value="final" className="bg-gray-800">Examen final</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
      {renderFilters()}
    </div>
  );
};

// Dashboard Content Components
const DashboardContent = ({ stats, user }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">
      Tableau de bord - {user.first_name} {user.last_name}
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {user.role === 'admin' && (
        <>
          <StatCard title="Total Étudiants" value={stats.total_students || 0} icon="👥" />
          <StatCard title="Total Professeurs" value={stats.total_teachers || 0} icon="👨‍🏫" />
          <StatCard title="Total Cours" value={stats.total_courses || 0} icon="📚" />
          <StatCard title="Propositions en attente" value={stats.pending_proposals || 0} icon="⏳" />
        </>
      )}
      
      {user.role === 'teacher' && (
        <>
          <StatCard title="Mes Cours" value={stats.my_courses || 0} icon="📚" />
          <StatCard title="Mes Propositions" value={stats.my_proposals || 0} icon="📝" />
        </>
      )}
      
      {user.role === 'student' && (
        <>
          <StatCard title="Mes Notes" value={stats.my_grades || 0} icon="📈" />
          <StatCard title="Cours Disponibles" value={stats.available_courses || 0} icon="📚" />
        </>
      )}
    </div>
  </div>
);

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-blue-200 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </div>
);

// Users Management Component
const UsersManagement = ({ 
  users, 
  onEdit, 
  onDelete, 
  onAdd, 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold text-white">Gestion des utilisateurs</h2>
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Ajouter un utilisateur
      </button>
    </div>

    <SearchAndFilter
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filters={filters}
      setFilters={setFilters}
      type="users"
    />

    <div className="grid gap-4">
      {users.map((user) => (
        <div key={user.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-blue-200">{user.email}</p>
              <div className="flex space-x-4 mt-2 text-sm text-gray-400">
                <span>Rôle: {user.role}</span>
                <span>Statut: {user.status}</span>
                {user.department && <span>Département: {user.department}</span>}
                {user.level && <span>Niveau: {user.level}</span>}
                {user.specialty && <span>Spécialité: {user.specialty}</span>}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(user)}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
              >
                Modifier
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CoursesContent = ({ 
  courses, 
  user, 
  onEdit, 
  onDelete, 
  onAdd, 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold text-white">
        {user.role === 'admin' ? 'Gestion des cours' : 'Mes Cours'}
      </h2>
      {(user.role === 'admin' || user.role === 'teacher') && (
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Ajouter un cours
        </button>
      )}
    </div>

    <SearchAndFilter
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filters={filters}
      setFilters={setFilters}
      type="courses"
    />
    
    <div className="grid gap-4">
      {courses.map((course) => (
        <div key={course.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-white">{course.name}</h3>
              <p className="text-blue-200">Code: {course.code}</p>
              <p className="text-gray-300 mt-2">{course.description}</p>
              <div className="flex space-x-4 mt-3 text-sm text-gray-400">
                <span>Département: {course.department}</span>
                <span>Crédits: {course.credits}</span>
                <span>Semestre: {course.semester}</span>
                <span>Année: {course.year}</span>
              </div>
            </div>
            {(user.role === 'admin' || (user.role === 'teacher' && course.teacher_id === user.id)) && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(course)}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                >
                  Modifier
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => onDelete(course.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ScheduleContent = ({ 
  schedules, 
  onEdit, 
  onDelete, 
  onAdd, 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters,
  user 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold text-white">Emploi du temps</h2>
      {user.role === 'admin' && (
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Ajouter un créneau
        </button>
      )}
    </div>

    <SearchAndFilter
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filters={filters}
      setFilters={setFilters}
      type="schedules"
    />
    
    <div className="grid gap-4">
      {schedules.map((schedule) => (
        <div key={schedule.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {schedule.course?.name || 'Cours'}
              </h3>
              <p className="text-blue-200">{schedule.day_of_week}</p>
              <p className="text-gray-300">
                {schedule.start_time} - {schedule.end_time}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">{schedule.classroom}</p>
              <p className="text-gray-400 text-sm">Salle</p>
              {user.role === 'admin' && (
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => onEdit(schedule)}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(schedule.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GradesContent = ({ 
  grades, 
  user, 
  onEdit, 
  onDelete, 
  onAdd, 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold text-white">
        {user.role === 'student' ? 'Mes Notes' : 'Gestion des notes'}
      </h2>
      {(user.role === 'teacher' || user.role === 'admin') && (
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Ajouter une note
        </button>
      )}
    </div>

    {(user.role === 'teacher' || user.role === 'admin') && (
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
        type="grades"
      />
    )}
    
    <div className="grid gap-4">
      {grades.map((grade) => (
        <div key={grade.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {grade.course?.name || 'Cours'}
              </h3>
              <p className="text-blue-200 capitalize">{grade.exam_type}</p>
              {grade.student && (
                <p className="text-gray-300">
                  Étudiant: {grade.student.first_name} {grade.student.last_name}
                </p>
              )}
              <p className="text-gray-400 text-sm">
                {new Date(grade.exam_date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {grade.score}/{grade.max_score}
              </p>
              <p className="text-gray-400 text-sm">
                {((grade.score / grade.max_score) * 100).toFixed(1)}%
              </p>
              {(user.role === 'teacher' || user.role === 'admin') && (
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => onEdit(grade)}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(grade.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ExamProposalsContent = ({ examProposals, user }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white">
      {user.role === 'admin' ? 'Gestion des examens' : 'Propositions d\'examens'}
    </h2>
    
    <div className="grid gap-4">
      {examProposals.map((proposal) => (
        <div key={proposal.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
              <p className="text-blue-200">{proposal.course?.name}</p>
              <p className="text-gray-300 mt-2">{proposal.description}</p>
              <p className="text-gray-400 text-sm mt-2">
                Date proposée: {new Date(proposal.proposed_date).toLocaleDateString()}
              </p>
              <p className="text-gray-400 text-sm">
                Durée: {proposal.duration_minutes} minutes
              </p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm ${
                proposal.status === 'pending' ? 'bg-yellow-600/30 text-yellow-200' :
                proposal.status === 'approved' ? 'bg-green-600/30 text-green-200' :
                'bg-red-600/30 text-red-200'
              }`}>
                {proposal.status === 'pending' ? 'En attente' :
                 proposal.status === 'approved' ? 'Approuvé' : 'Rejeté'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AttendanceContent = ({ attendance }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">Présences</h2>
    
    <div className="grid gap-4">
      {attendance.map((record) => (
        <div key={record.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {record.course?.name || 'Cours'}
              </h3>
              <p className="text-blue-200">
                {record.teacher?.first_name} {record.teacher?.last_name}
              </p>
              <p className="text-gray-400 text-sm">
                {new Date(record.date).toLocaleDateString()}
              </p>
              {record.notes && (
                <p className="text-gray-300 text-sm mt-2">{record.notes}</p>
              )}
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                record.status === 'present' ? 'bg-green-600/30 text-green-200' : 'bg-red-600/30 text-red-200'
              }`}>
                {record.status === 'present' ? 'Présent' : 'Absent'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Form Modal Component
const FormModal = ({ type, item, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({});
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize form data
    if (item) {
      setFormData(item);
    } else {
      // Set default values based on type
      switch (type) {
        case 'user':
          setFormData({
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            role: 'student',
            status: 'active',
            department: '',
            year: 1,
            level: 'L1',
            field_of_study: '',
            specialty: '',
            phone: '',
            address: ''
          });
          break;
        case 'course':
          setFormData({
            name: '',
            code: '',
            description: '',
            teacher_id: '',
            department: '',
            credits: 3,
            semester: 'Automne',
            year: new Date().getFullYear()
          });
          break;
        case 'schedule':
          setFormData({
            course_id: '',
            day_of_week: 'Lundi',
            start_time: '09:00',
            end_time: '11:00',
            classroom: ''
          });
          break;
        case 'grade':
          setFormData({
            student_id: '',
            course_id: '',
            exam_type: 'continuous',
            score: 0,
            max_score: 20,
            exam_date: new Date().toISOString().split('T')[0]
          });
          break;
        default:
          setFormData({});
      }
    }

    // Fetch additional data if needed
    if (type === 'course' || type === 'schedule' || type === 'grade') {
      fetchCourses();
    }
    if (type === 'grade') {
      fetchStudents();
    }
  }, [type, item]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API}/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/admin/users?role=student`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint = '';
      let method = 'POST';
      let data = { ...formData };

      switch (type) {
        case 'user':
          endpoint = item ? `admin/users/${item.id}` : 'admin/users';
          method = item ? 'PUT' : 'POST';
          break;
        case 'course':
          endpoint = item ? `courses/${item.id}` : 'courses';
          method = item ? 'PUT' : 'POST';
          break;
        case 'schedule':
          endpoint = item ? `schedules/${item.id}` : 'schedules';
          method = item ? 'PUT' : 'POST';
          break;
        case 'grade':
          endpoint = item ? `grades/${item.id}` : 'grades';
          method = item ? 'PUT' : 'POST';
          break;
        default:
          throw new Error('Unknown form type');
      }

      const request = method === 'POST' 
        ? axios.post(`${API}/${endpoint}`, data)
        : axios.put(`${API}/${endpoint}`, data);

      await request;
      onSave();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erreur lors de la sauvegarde');
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type: inputType } = e.target;
    setFormData({
      ...formData,
      [name]: inputType === 'number' ? Number(value) : value
    });
  };

  const renderFormFields = () => {
    switch (type) {
      case 'user':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
              {!item && (
                <input
                  type="password"
                  name="password"
                  placeholder="Mot de passe"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                  required
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="first_name"
                placeholder="Prénom"
                value={formData.first_name || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
              <input
                type="text"
                name="last_name"
                placeholder="Nom"
                value={formData.last_name || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select
                name="role"
                value={formData.role || 'student'}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                disabled={!!item}
              >
                <option value="student" className="bg-gray-800">Étudiant</option>
                <option value="teacher" className="bg-gray-800">Professeur</option>
                <option value="admin" className="bg-gray-800">Administrateur</option>
              </select>
              <select
                name="status"
                value={formData.status || 'active'}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="active" className="bg-gray-800">Actif</option>
                <option value="inactive" className="bg-gray-800">Inactif</option>
                <option value="suspended" className="bg-gray-800">Suspendu</option>
              </select>
            </div>
            <input
              type="text"
              name="department"
              placeholder="Département"
              value={formData.department || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
            />
            {formData.role === 'student' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="student_id"
                    placeholder="ID Étudiant"
                    value={formData.student_id || ''}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                  />
                  <select
                    name="level"
                    value={formData.level || 'L1'}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="L1" className="bg-gray-800">L1</option>
                    <option value="L2" className="bg-gray-800">L2</option>
                    <option value="L3" className="bg-gray-800">L3</option>
                    <option value="M1" className="bg-gray-800">M1</option>
                    <option value="M2" className="bg-gray-800">M2</option>
                  </select>
                  <input
                    type="number"
                    name="year"
                    placeholder="Année"
                    value={formData.year || 1}
                    onChange={handleInputChange}
                    min="1"
                    max="5"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <input
                  type="text"
                  name="field_of_study"
                  placeholder="Filière d'étude"
                  value={formData.field_of_study || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                />
              </>
            )}
            {formData.role === 'teacher' && (
              <input
                type="text"
                name="specialty"
                placeholder="Spécialité"
                value={formData.specialty || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="tel"
                name="phone"
                placeholder="Téléphone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
              />
              <input
                type="text"
                name="address"
                placeholder="Adresse"
                value={formData.address || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
              />
            </div>
          </>
        );
      case 'course':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Nom du cours"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
              <input
                type="text"
                name="code"
                placeholder="Code du cours"
                value={formData.code || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="department"
                placeholder="Département"
                value={formData.department || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
              <input
                type="number"
                name="credits"
                placeholder="Crédits"
                value={formData.credits || 3}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select
                name="semester"
                value={formData.semester || 'Automne'}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                required
              >
                <option value="Automne" className="bg-gray-800">Automne</option>
                <option value="Printemps" className="bg-gray-800">Printemps</option>
                <option value="Été" className="bg-gray-800">Été</option>
              </select>
              <input
                type="number"
                name="year"
                placeholder="Année"
                value={formData.year || new Date().getFullYear()}
                onChange={handleInputChange}
                min="2020"
                max="2030"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <input
              type="text"
              name="teacher_id"
              placeholder="ID Professeur"
              value={formData.teacher_id || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
              required
            />
          </>
        );
      case 'schedule':
        return (
          <>
            <select
              name="course_id"
              value={formData.course_id || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              required
            >
              <option value="" className="bg-gray-800">Sélectionner un cours</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id} className="bg-gray-800">
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-4">
              <select
                name="day_of_week"
                value={formData.day_of_week || 'Lundi'}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                required
              >
                <option value="Lundi" className="bg-gray-800">Lundi</option>
                <option value="Mardi" className="bg-gray-800">Mardi</option>
                <option value="Mercredi" className="bg-gray-800">Mercredi</option>
                <option value="Jeudi" className="bg-gray-800">Jeudi</option>
                <option value="Vendredi" className="bg-gray-800">Vendredi</option>
              </select>
              <input
                type="time"
                name="start_time"
                value={formData.start_time || '09:00'}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                required
              />
              <input
                type="time"
                name="end_time"
                value={formData.end_time || '11:00'}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <input
              type="text"
              name="classroom"
              placeholder="Salle de classe"
              value={formData.classroom || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
              required
            />
          </>
        );
      case 'grade':
        return (
          <>
            <select
              name="student_id"
              value={formData.student_id || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              required
            >
              <option value="" className="bg-gray-800">Sélectionner un étudiant</option>
              {users.map((student) => (
                <option key={student.id} value={student.id} className="bg-gray-800">
                  {student.first_name} {student.last_name} ({student.student_id})
                </option>
              ))}
            </select>
            <select
              name="course_id"
              value={formData.course_id || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              required
            >
              <option value="" className="bg-gray-800">Sélectionner un cours</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id} className="bg-gray-800">
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-4">
              <select
                name="exam_type"
                value={formData.exam_type || 'continuous'}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                required
              >
                <option value="continuous" className="bg-gray-800">Contrôle continu</option>
                <option value="final" className="bg-gray-800">Examen final</option>
              </select>
              <input
                type="date"
                name="exam_date"
                value={formData.exam_date || ''}
                onChange={handleInputChange}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="score"
                placeholder="Note obtenue"
                value={formData.score || 0}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
              <input
                type="number"
                name="max_score"
                placeholder="Note maximale"
                value={formData.max_score || 20}
                onChange={handleInputChange}
                min="1"
                step="0.1"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {item ? 'Modifier' : 'Ajouter'} {
              type === 'user' ? 'un utilisateur' :
              type === 'course' ? 'un cours' :
              type === 'schedule' ? 'un créneau' :
              type === 'grade' ? 'une note' : ''
            }
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;