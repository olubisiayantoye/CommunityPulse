import { query } from '../config/database.js';

// CREATE
export const createCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    
    const result = await query(
      `INSERT INTO categories (name, description, color) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name.trim(), description?.trim() || null, color || '#3B82F6']
    );
    
    res.status(201).json({ message: 'Category created', category: result.rows[0] });
  } catch (err) {
    console.error('Create category error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// READ (list)
export const getCategories = async (req, res) => {
  try {
    const { include_inactive = false } = req.query;
    const whereClause = include_inactive === 'true' ? '' : 'WHERE is_active = true';
    
    const result = await query(
      `SELECT * FROM categories ${whereClause} ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// READ (single)
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch category error:', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

// UPDATE
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, is_active } = req.body;
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name.trim());
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description?.trim() || null);
      paramIndex++;
    }
    if (color !== undefined) {
      updates.push(`color = $${paramIndex}`);
      params.push(color);
      paramIndex++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    const result = await query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category updated', category: result.rows[0] });
  } catch (err) {
    console.error('Update category error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// DELETE (soft delete via is_active)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has feedback
    const feedbackCheck = await query(
      'SELECT COUNT(*) as count FROM feedback WHERE category_id = $1',
      [id]
    );
    
    if (parseInt(feedbackCheck.rows[0].count) > 0) {
      // Soft delete: mark as inactive instead of hard delete
      const result = await query(
        'UPDATE categories SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      return res.json({ message: 'Category deactivated (has existing feedback)', category: result.rows[0] });
    }
    
    // Hard delete if no feedback exists
    const result = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted', category: result.rows[0] });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};