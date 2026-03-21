/**
 * Admin Panel Page - CommunityPulse
 * Comprehensive admin dashboard with full management capabilities
 */

import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeedback, useCategories } from '../hooks/useFeedback';
import { adminApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
//import { SentimentPie, TrendChart, CategoryBar } from '../components/charts';
import { SentimentPie } from "../components/charts/SentimentPie.jsx";
import { TrendChart } from "../components/charts/TrendChart.jsx";
import { CategoryBar } from "../components/charts/CategoryBar.jsx";

import { FeedbackCard } from '../components/feedback/FeedbackCard';
import { StatusBadge } from '../components/admin/StatusBadge';
import { ExportButton } from '../components/admin/ExportButton';
import { 
  BarChart3, Users, MessageSquare, Download, RefreshCw, 
  AlertCircle, CheckCircle, Clock, TrendingUp, Filter,
  Search, Plus, Edit, Trash2, Eye, Shield, Activity,
  ChevronDown, ChevronUp, X, Check
} from 'lucide-react';
import { formatDate, SENTIMENT_STYLES, STATUS_STYLES } from '../lib/utils';
import { useApi } from '../hooks/useApi';

// Admin-only tabs
const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'pending', label: 'Pending Issues', icon: AlertCircle },
  { id: 'feedback', label: 'All Feedback', icon: MessageSquare },
  { id: 'categories', label: 'Categories', icon: Filter },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity }
];

export function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    sentiment_label: '',
    category_id: '',
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data
  const { data: stats, loading: statsLoading, execute: refreshStats } = useApi(adminApi.getStats);
  const { data: analytics, loading: analyticsLoading } = useApi(() => adminApi.getAnalytics({ period: '7d' }));
  const { data: pending, loading: pendingLoading, execute: refreshPending } = useApi(() => adminApi.getPending({ limit: 20 }));
  const { data: activity, loading: activityLoading } = useApi(() => adminApi.getUsers({ limit: 15 }));
  const {  categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { feedback, isLoading: feedbackLoading, deleteFeedback } = useFeedback(filters);
  const { data: usersData, loading: usersLoading, execute: refreshUsers } = useApi(() => adminApi.getUsers({ page: 1, limit: 20 }));

  // Check admin access
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle status update
  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      await adminApi.updateStatus(feedbackId, { status: newStatus });
      refreshStats();
      refreshPending();
      alert('Status updated successfully');
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to update status');
    }
  };

  // Handle category CRUD
  const handleCreateCategory = async (data) => {
    try {
      await adminApi.createCategory(data);
      refetchCategories();
      alert('Category created successfully');
    } catch (err) {
      console.error('Create category failed:', err);
      alert(err.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (id, data) => {
    try {
      await adminApi.updateCategory(id, data);
      refetchCategories();
      alert('Category updated successfully');
    } catch (err) {
      console.error('Update category failed:', err);
      alert(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminApi.deleteCategory(id);
      refetchCategories();
      alert('Category deleted successfully');
    } catch (err) {
      console.error('Delete category failed:', err);
      alert(err.message || 'Failed to delete category');
    }
  };

  // Handle user role update
  const handleUpdateUserRole = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      await adminApi.updateUserRole(userId, { role: newRole });
      refreshUsers();
      alert('User role updated successfully');
    } catch (err) {
      console.error('Update role failed:', err);
      alert(err.message || 'Failed to update user role');
    }
  };

  // Handle user deactivation
  const handleDeactivateUser = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await adminApi.deactivateUser(userId);
      refreshUsers();
      alert('User deactivated successfully');
    } catch (err) {
      console.error('Deactivate user failed:', err);
      alert(err.message || 'Failed to deactivate user');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({ sentiment_label: '', category_id: '', status: '', search: '', page: 1, limit: 20 });
  };

  return (
    <div className="space-y-6">
      
      {/* ===== PAGE HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage community feedback, users, and settings
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ExportButton />
          <Button variant="ghost" size="sm" onClick={() => { refreshStats(); refreshPending(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                    ${isActive 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </Card>

      {/* ===== TAB CONTENT ===== */}
      
      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 md:p-6 border-l-4 border-primary-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {statsLoading ? '-' : stats?.stats?.total_feedback || 0}
                  </p>
                </div>
                <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                  <MessageSquare className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Positive</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">
                    {statsLoading ? '-' : stats?.stats?.positive_count || 0}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <Smile className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Negative</p>
                  <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">
                    {statsLoading ? '-' : stats?.stats?.negative_count || 0}
                  </p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                  <Frown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1">
                    {statsLoading ? '-' : stats?.stats?.pending_count || 0}
                  </p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sentiment Distribution
                </h3>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                  </div>
                ) : (
                  <SentimentPie 
                    data={{
                      positive: stats?.stats?.positive_count || 0,
                      neutral: stats?.stats?.neutral_count || 0,
                      negative: stats?.stats?.negative_count || 0,
                      total: stats?.stats?.total_feedback || 0
                    }} 
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  7-Day Trends
                </h3>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                  </div>
                ) : (
                  <TrendChart feedback={analytics?.trends || []} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Issues Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Priority Issues (Negative & Pending)
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('pending')}>
                  View All
                  <ChevronDown className="w-4 h-4 ml-1 rotate-[-90deg]" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pending?.length > 0 ? (
                <div className="space-y-4">
                  {pending.slice(0, 5).map(item => (
                    <div key={item.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={item.status} />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(item.created_at, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200">{item.message}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(item.id, 'in_progress')}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(item.id, 'resolved')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 dark:text-green-400 font-medium">
                    🎉 No pending issues!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    All feedback has been addressed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* PENDING ISSUES TAB */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Issues ({pending?.length || 0})
              </h3>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
                </div>
              ) : pending?.length > 0 ? (
                <div className="space-y-4">
                  {pending.map(item => (
                    <Card key={item.id} className="border-l-4 border-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                {item.sentiment_label}
                              </span>
                              {item.category_name && (
                                <span 
                                  className="text-xs font-medium px-2 py-1 rounded"
                                  style={{ 
                                    backgroundColor: `${item.category_color}20`,
                                    color: item.category_color 
                                  }}
                                >
                                  {item.category_name}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 mb-3">{item.message}</p>
                            <div className="flex items-center gap-2">
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="dismissed">Dismissed</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(item.id, 'resolved')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Resolved
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    All Caught Up!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No pending issues requiring attention
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ALL FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filters.sentiment_label}
                  onChange={(e) => handleFilterChange('sentiment_label', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Sentiments</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>

                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full md:w-64"
                />

                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          {feedbackLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            </div>
          ) : feedback.length > 0 ? (
            <div className="space-y-4">
              {feedback.map(item => (
                <FeedbackCard 
                  key={item.id} 
                  feedback={item} 
                  showActions={true}
                  onStatusUpdate={(id, status) => handleStatusUpdate(id, status)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No feedback found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <CategoryManagement 
          categories={categories}
          isLoading={categoriesLoading}
          onCreate={handleCreateCategory}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <UserManagement 
          users={usersData?.users || []}
          isLoading={usersLoading}
          onUpdateRole={handleUpdateUserRole}
          onDeactivate={handleDeactivateUser}
        />
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
              </div>
            ) : activity?.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{item.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.author} • {formatDate(item.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}