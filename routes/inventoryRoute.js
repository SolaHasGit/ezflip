const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  insertItem,
  getItemsByUser,
  updateItemById,
  deleteItemById,
  uploadImageToSupabase
} = require('../services/inventoryService');

const { getUserFromToken } = require('../services/supabaseService');

// Middleware: Authenticate user from token
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  const { user, error } = await getUserFromToken(token);
  if (error || !user) return res.status(401).json({ message: 'Invalid or expired token' });

  req.user = user;
  next();
}

// GET /items
router.get('/items', authenticate, async (req, res) => {
    const { data, error } = await getItemsByUser(req.user.id);
    if (error) return res.status(500).json({ message: error.message });
    res.status(200).json(data);
  });
  
  // POST /items/add - With optional image
  router.post('/items/add', authenticate, upload.single('image'), async (req, res) => {
    const file = req.file;
    const userId = req.user.id;
  
    const {
      name,
      purchase_price,
      selling_price,
      storage_location,
      notes,
      status
    } = req.body;
  
    let imageUrl = null;
    if (file) {
      const { imageUrl: uploadedUrl, error: uploadError } = await uploadImageToSupabase(file);
      if (uploadError) return res.status(500).json({ message: uploadError.message });
      imageUrl = uploadedUrl;
    }
  
    const { data, error } = await insertItem({
      name,
      purchase_price,
      selling_price,
      storage_location,
      notes,
      status,
      user_id: userId,
      imageURL: imageUrl,
      dateadded: new Date().toISOString()
    });
  
    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json({ item: data[0] });
  });
  
  // PATCH /items/:id/update
  router.patch('/items/:id/update', authenticate, async (req, res) => {
    const { error } = await updateItemById(req.params.id, req.user.id, req.body);
    if (error) return res.status(500).json({ message: error.message });
    res.status(200).json({ message: 'Item updated successfully' });
  });
  
  // DELETE /items/:id/delete
  router.delete('/items/:id/delete', authenticate, async (req, res) => {
    const { error } = await deleteItemById(req.params.id, req.user.id);
    if (error) return res.status(500).json({ message: error.message });
    res.status(204).end();
  });

module.exports = router;
