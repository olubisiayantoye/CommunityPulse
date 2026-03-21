/**
 * Dashboard Page - CommunityPulse
 * User dashboard with feedback list, stats, and filtering
 */

import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeedback, useCategories } from '../hooks/useFeedback';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
//import { SentimentPie, TrendChart } from '../components/charts';
import { SentimentPie } from "../components/charts/SentimentPie.jsx";
import { TrendChart } from "../components/charts/TrendChart.jsx";
import { FeedbackCard } from '../components/feedback/FeedbackCard';
import { 
  Plus, Filter, Download, RefreshCw, MessageSquare, 
  TrendingUp, Smile, Frown, Meh, AlertCircle, CheckCircle 
} from 'lucide-react';
import { formatDate, SENTIMENT_STYLES } from '../lib/utils';
import { ROUTES } from '../lib/constants';

export function Dashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State for filters
  const [filters, setFilters] = useState({
    category_id: '',
    sentiment_label: '',
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data
  const { 
    feedback, 
    pagination, 
    isLoading, 
    isError, 
    error, 
    fetchNextPage, 
    hasNextPage 
  } = useFeedback(filters);
  
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Calculate stats from feedback
  const stats = useMemo(() => {
    if (!feedback || feedback.length === 0) {
      return { total: 0, positive: 0, neutral: 0, negative: 0 };
    }
    
    return {
      total: feedback.length,
      positive: feedback.filter(f => f.sentiment_label === 'Positive').length,
      neutral: feedback.filter(f => f.sentiment_label === 'Neutral').length,
      negative: feedback.filter(f => f.sentiment_label === 'Negative').length
    };
  }, [feedback]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      category_id: '',
      sentiment_label: '',
      status: '',
      search: '',
      page: 1,
      limit: 20
    });
  };

  // Handle export
  const handleExport = async () => {
    try {
      const { adminApi } = await import('../lib/api');
      const response = await adminApi.export({
        format: 'csv',
        ...filters
      });
      
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `community-pulse-feedback-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ===== WELCOME BANNER ===== */}
      <Card className="bg-gradient-to-r from-primary-600 to-blue-700 text-white shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome, {user?.username || 'Member'}!
              </h1>
              <p className="mt-1 text-primary-100">
                Share your thoughts and help improve our community.
              </p>
              {isAdmin && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Admin Access
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={ROUTES.SUBMIT}>
                <Button variant="secondary" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  New Feedback
                </Button>
              </Link>
              {isAdmin && (
                <Link to={ROUTES.ADMIN}>
                  <Button variant="ghost" className="text-white border-white hover:bg-white/10" size="lg">
                    Admin Panel
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <Card className="p-4 md:p-6 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        {/* Positive */}
        <Card className="p-4 md:p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Positive</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">
                {stats.positive}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <Smile className="w-6 h-6 text-green-600" />
            </div>
          </div>
          {stats.total > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {Math.round((stats.positive / stats.total) * 100)}% of total
            </p>
          )}
        </Card>

        {/* Neutral */}
        <Card className="p-4 md:p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Neutral</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1">
                {stats.neutral}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
              <Meh className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          {stats.total > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {Math.round((stats.neutral / stats.total) * 100)}% of total
            </p>
          )}
        </Card>

        {/* Negative */}
        <Card className="p-4 md:p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Negative</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">
                {stats.negative}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
              <Frown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          {stats.total > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {Math.round((stats.negative / stats.total) * 100)}% of total
            </p>
          )}
        </Card>
      </div>

      {/* ===== FILTERS & ACTIONS ===== */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Filter Toggle (Mobile) */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Feedback List
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-wrap items-center gap-3`}>
              
              {/* Category Filter */}
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Sentiment Filter */}
              <select
                value={filters.sentiment_label}
                onChange={(e) => handleFilterChange('sentiment_label', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Sentiments</option>
                <option value="Positive">😊 Positive</option>
                <option value="Neutral">😐 Neutral</option>
                <option value="Negative">😔 Negative</option>
              </select>

              {/* Search */}
              <input
                type="text"
                placeholder="Search feedback..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         w-full md:w-48"
              />

              {/* Reset Filters */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-gray-600 dark:text-gray-400"
              >
                Reset
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant="secondary" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{feedback.length}</span> feedback items
              {pagination?.totalPages > 1 && (
                <span> of <span className="font-medium">{pagination.total}</span> total</span>
              )}
            </p>
            {pagination?.page < pagination?.totalPages && (
              <Button variant="ghost" size="sm" onClick={() => fetchNextPage()}>
                Load More
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== CHARTS ROW ===== */}
      {feedback.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sentiment Distribution
              </h3>
            </CardHeader>
            <CardContent>
              <SentimentPie data={stats} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                7-Day Trends
              </h3>
            </CardHeader>
            <CardContent>
              <TrendChart feedback={feedback} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== FEEDBACK LIST ===== */}
      <div className="space-y-4">
        {feedback.length > 0 ? (
          feedback.map(item => (
            <FeedbackCard 
              key={item.id} 
              feedback={item} 
              showActions={isAdmin || item.user_id === user?.id}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No feedback yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Be the first to share your thoughts with the community!
              </p>
              <Link to={ROUTES.SUBMIT}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Feedback
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFilterChange('page', pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFilterChange('page', pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}