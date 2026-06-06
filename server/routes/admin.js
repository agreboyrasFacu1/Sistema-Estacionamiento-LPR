// ...existing code...
router.post('/settings', async (req, res) => {
  const { pricePerHour, abonoValue } = req.body;

  try {
    await Settings.updateOne({}, { pricePerHour, abonoValue }, { upsert: true });
    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});
// ...existing code...
