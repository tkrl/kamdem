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
    year: 1
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
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="student_id"
                    placeholder="ID Étudiant"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                  />
                  <input
                    type="number"
                    name="year"
                    placeholder="Année"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="1"
                    max="5"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                  />
                </div>
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
      const response = await axios.get(`${API}/courses/my`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${API}/schedules`);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent stats={stats} user={user} />;
      case 'courses':
        return <CoursesContent courses={courses} user={user} />;
      case 'schedule':
        return <ScheduleContent schedules={schedules} />;
      case 'grades':
        return <GradesContent grades={grades} />;
      case 'exams':
        return <ExamProposalsContent examProposals={examProposals} />;
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
        { key: 'exams', label: 'Propositions d\'examens', icon: '📝' },
        { key: 'attendance', label: 'Présences', icon: '✅' }
      ];
    } else if (user.role === 'admin') {
      return [
        ...baseItems,
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

const CoursesContent = ({ courses }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">Mes Cours</h2>
    
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
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ScheduleContent = ({ schedules }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">Emploi du temps</h2>
    
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
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GradesContent = ({ grades }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">Mes Notes</h2>
    
    <div className="grid gap-4">
      {grades.map((grade) => (
        <div key={grade.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {grade.course?.name || 'Cours'}
              </h3>
              <p className="text-blue-200 capitalize">{grade.exam_type}</p>
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
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ExamProposalsContent = ({ examProposals }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">Propositions d'examens</h2>
    
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

export default App;