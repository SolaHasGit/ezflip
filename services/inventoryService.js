// services/itemService.js
const { supabase, BUCKET_NAME } = require('./supabaseService');

// Insert a new item
async function insertItem(itemData) {
  return await supabase
    .from('inventory_items')
    .insert([itemData]);
}

// Get all items for a user
async function getItemsByUser(userId) {
  return await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .order('dateadded', { ascending: false });
}

// Update an item if it belongs to the user
async function updateItemById(itemId, userId, updates) {
  return await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', itemId)
    .eq('user_id', userId);
}

// Delete an item if it belongs to the user
async function deleteItemById(itemId, userId) {
  return await supabase
    .from('inventory_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);
}

// Upload image to Supabase Storage
async function uploadImageToSupabase(file) {
  const filePath = `images/${Date.now()}-${file.originalname}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) return { imageUrl: null, error };

  const imageUrl = `https://nscfwqcjtpkfweokcqha.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
  return { imageUrl, error: null };
}

module.exports = {
  insertItem,
  getItemsByUser,
  updateItemById,
  deleteItemById,
  uploadImageToSupabase
};
