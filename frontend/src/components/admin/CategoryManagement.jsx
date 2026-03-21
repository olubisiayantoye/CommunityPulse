/**
 * Category Management Component - CommunityPulse
 */

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';

export function CategoryManagement({ categories, isLoading, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3B82F6' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      await onCreate(formData);
    }
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setShowCreate(false);
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description || '', color: category.color });
    setShowCreate(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setShowCreate(false);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      {!showCreate && !editingId && (
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      )}

      {/* Create/Edit Form */}
      {(showCreate || editingId) && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Category name"
            />
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              <Check className="w-4 h-4 mr-2" />
              {editingId ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map(cat => (
          <div
            key={cat.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ borderLeftColor: cat.color, borderLeftWidth: '4px' }}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h4>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(cat.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {cat.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{cat.description}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {cat.feedback_count || 0} feedback items
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}