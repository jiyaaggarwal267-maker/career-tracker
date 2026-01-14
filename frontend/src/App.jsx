
import axios from "axios";


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Briefcase, Calendar, FileText, X, Search, Filter, MapPin, TrendingUp, CheckCircle2, Clock, XCircle, Sparkles } from 'lucide-react';

// ============================================
// MOCK API (Simulating Backend)
// ============================================
// In production, replace this with actual axios calls to backend
const BASE_URL = "https://career-tracker-csp6.onrender.com/";

const api = {
  getApplications: async () => {
    const res = await axios.get(BASE_URL);
    return res.data;
  },

  createApplication: async (app) => {
    const res = await axios.post(BASE_URL, app);
    return res.data;
  },

  updateApplication: async (id, app) => {
    const res = await axios.put(`${BASE_URL}/${id}`, app);
    return res.data;
  },

  deleteApplication: async (id) => {
    await axios.delete(`${BASE_URL}/${id}`);
    return { success: true };
  }
};




// ============================================
// STATUS CONFIGURATION
// ============================================
// Define colors, icons, and styles for each status

const statusConfig = {
  Applied: { 
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-cyan-300',
    icon: Clock,
    glow: 'shadow-cyan-500/50'
  },
  Interview: { 
    color: 'from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300',
    icon: TrendingUp,
    glow: 'shadow-purple-500/50'
  },
  Offer: { 
    color: 'from-emerald-500/20 to-green-500/20 border-emerald-400/50 text-emerald-300',
    icon: CheckCircle2,
    glow: 'shadow-emerald-500/50'
  },
  Rejected: { 
    color: 'from-red-500/20 to-orange-500/20 border-red-400/50 text-red-300',
    icon: XCircle,
    glow: 'shadow-red-500/50'
  }
};

// ============================================
// STATUS TIMELINE COMPONENT
// ============================================
// Visual progress tracker: Applied → Interview → Offer/Rejected

const StatusTimeline = ({ currentStatus }) => {
  // Determine timeline path based on status
  const statuses = ['Applied', 'Interview', 'Offer'];
  const rejectedStatuses = ['Applied', 'Interview', 'Rejected'];
  
  const timeline = currentStatus === 'Rejected' ? rejectedStatuses : statuses;
  const currentIndex = timeline.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between mb-4 px-2">
      {timeline.map((status, index) => {
        const StatusIcon = statusConfig[status].icon;
        const isActive = index <= currentIndex;
        
        return (
          <div key={status} className="flex items-center flex-1">
            {/* Status node */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${statusConfig[status].color.split(' ')[0]} ${statusConfig[status].color.split(' ')[1]} border-white/50` 
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <StatusIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              </motion.div>
              <span className={`text-xs mt-1 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {status}
              </span>
            </div>
            
            {/* Connecting line */}
            {index < timeline.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 relative overflow-hidden bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isActive ? '100%' : '0%' }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// FLOATING PARTICLES COMPONENT
// ============================================
// Creates animated starfield effect in background

const FloatingParticles = () => {
  // Generate 50 random particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  // State management
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form state
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Applied',
    location: '',
    notes: ''
  });

  // Load applications on mount
  useEffect(() => {
    loadApplications();
  }, []);

  // Filter and sort applications whenever dependencies change
  useEffect(() => {
    let filtered = [...apps];

    // Filter by status
    if (filterStatus !== 'All') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }

    // Search by company or role
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredApps(filtered);
  }, [apps, filterStatus, searchTerm, sortOrder]);

  // Load all applications from API
  const loadApplications = async () => {
    setLoading(true);
    const data = await api.getApplications();
    setApps(data);
    setLoading(false);
  };

  // Handle form submission (create or update)
  const handleSubmit = () => {
    // Validate required fields
    if (!formData.company || !formData.role || !formData.date) return;
    
    if (editingApp) {
      api.updateApplication(editingApp.id, formData).then(loadApplications);
    } else {
      api.createApplication(formData).then(loadApplications);
    }
    closeModal();
  };

  // Delete application
  const handleDelete = async (id) => {
    if (window.confirm('Delete this application?')) {
      await api.deleteApplication(id);
      await loadApplications();
    }
  };

  // Open modal for create or edit
  const openModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormData(app);
    } else {
      setEditingApp(null);
      setFormData({
        company: '',
        role: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Applied',
        location: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  // Close modal and reset state
  const closeModal = () => {
    setShowModal(false);
    setEditingApp(null);
  };

  // Calculate statistics
  const stats = {
    total: apps.length,
    applied: apps.filter(a => a.status === 'Applied').length,
    interview: apps.filter(a => a.status === 'Interview').length,
    offer: apps.filter(a => a.status === 'Offer').length,
    rejected: apps.filter(a => a.status === 'Rejected').length
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      
      {/* ========== ANIMATED SPACE BACKGROUND ========== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Nebula clouds with pulsing animation */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl"
        />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Floating particles starfield */}
      <FloatingParticles />

      {/* ========== MAIN CONTENT ========== */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        
        {/* ========== HEADER ========== */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 text-center"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-12 h-12 text-purple-400" />
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Career Nexus
          </h1>
          <p className="text-gray-400 text-lg">Track your journey through the cosmos of opportunities</p>
        </motion.div>

        {/* ========== STATS CARDS ========== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'from-indigo-500 to-purple-500', icon: Briefcase },
            { label: 'Applied', value: stats.applied, color: 'from-cyan-500 to-blue-500', icon: Clock },
            { label: 'Interview', value: stats.interview, color: 'from-purple-500 to-pink-500', icon: TrendingUp },
            { label: 'Offers', value: stats.offer, color: 'from-emerald-500 to-green-500', icon: CheckCircle2 },
            { label: 'Rejected', value: stats.rejected, color: 'from-red-500 to-orange-500', icon: XCircle }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.08, y: -8 }}
                className="relative group cursor-pointer"
              >
                {/* Pulsing glow effect */}
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(139, 92, 246, 0)',
                      '0 0 30px rgba(139, 92, 246, 0.3)',
                      '0 0 20px rgba(139, 92, 246, 0)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-br opacity-20 rounded-2xl blur"
                />
                
                {/* Card content */}
                <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5 hover:border-white/40 transition-all">
                  <Icon className="w-6 h-6 text-purple-400 mb-2" />
                  <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ========== CONTROLS (Search, Filter, Sort, Add) ========== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          {/* Search input */}
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <input
              type="text"
              placeholder="Search companies or roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 backdrop-blur-xl transition-all placeholder:text-gray-500"
            />
          </div>

          {/* Status filter */}
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 backdrop-blur-xl appearance-none cursor-pointer transition-all"
            >
              <option value="All">All Status</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Sort toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all backdrop-blur-xl font-medium"
          >
            Date: {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </motion.button>

          {/* Add button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50"
          >
            <Plus className="w-5 h-5" />
            Add Application
          </motion.button>
        </motion.div>

        {/* ========== APPLICATIONS GRID ========== */}
        {loading ? (
          // Loading state
          <div className="flex flex-col items-center justify-center h-96">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full mb-4"
            />
            <p className="text-gray-400">Loading applications...</p>
          </div>
        ) : (
          // Applications grid
          <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredApps.map((app, index) => {
                const StatusIcon = statusConfig[app.status].icon;
                return (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -12, scale: 1.02 }}
                    className="relative group"
                  >
                    {/* Animated glow on hover */}
                    <motion.div
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`absolute inset-0 bg-gradient-to-br ${statusConfig[app.status].color.split(' ')[0]} ${statusConfig[app.status].color.split(' ')[1]} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity`}
                    />
                    
                    {/* Card */}
                    <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:border-white/40 transition-all overflow-hidden">
                      {/* Corner accent */}
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${statusConfig[app.status].color.split(' ')[0]} ${statusConfig[app.status].color.split(' ')[1]} opacity-20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2`} />
                      
                      {/* Status badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-gradient-to-r ${statusConfig[app.status].color} border backdrop-blur-sm`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {app.status}
                      </div>

                      {/* Company name */}
                      <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 group-hover:text-purple-300 transition-colors">
                        <Briefcase className="w-6 h-6 text-purple-400" />
                        {app.company}
                      </h3>

                      {/* Role */}
                      <p className="text-gray-300 mb-3 font-medium">{app.role}</p>

                      {/* Location */}
                      {app.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <MapPin className="w-4 h-4 text-cyan-400" />
                          {app.location}
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <Calendar className="w-4 h-4 text-pink-400" />
                        {new Date(app.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>

                      {/* Status timeline */}
                      <StatusTimeline currentStatus={app.status} />

                      {/* Notes */}
                      {app.notes && (
                        <div className="flex items-start gap-2 text-sm text-gray-400 mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
                          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-400" />
                          <p className="line-clamp-3">{app.notes}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openModal(app)}
                          className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-purple-400/50 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(app.id)}
                          className="py-2.5 px-4 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:border-red-500/40 transition-all text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty state */}
        {filteredApps.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-6"
            >
              🚀
            </motion.div>
            <p className="text-gray-400 text-xl mb-2">No applications found</p>
            <p className="text-gray-500">Start your journey by adding your first application!</p>
          </motion.div>
        )}
      </div>

      {/* ========== MODAL (Create/Edit Form) ========== */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 border border-white/20 rounded-2xl p-8 w-full max-w-lg relative backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto"

            >
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Modal title */}
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {editingApp ? 'Edit Application' : 'New Application'}
              </h2>

              {/* Form fields */}
<form
  className="space-y-5"
  onSubmit={(e) => {
    e.preventDefault();
    handleSubmit();
  }}
>

                {/* Company */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="Google, Meta, Amazon..."
                  />
                </div>

                <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Role / Position *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                placeholder="Software Engineer, Product Manager..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Date Applied *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
              </div>

             <div>
  <label className="block text-sm font-semibold mb-2 text-gray-300">Status *</label>
  <select
    value={formData.status}
    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
  >
    {Object.keys(statusConfig).map((status) => (
      <option key={status} value={status}>
        {status}
      </option>
    ))}
  </select>
</div>

            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                placeholder="San Francisco, CA / Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="4"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 resize-none transition-all"
                placeholder="Interview dates, recruiter contact, important details..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={closeModal}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50"
              >
                {editingApp ? 'Update' : 'Create'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
);
}
export default App;