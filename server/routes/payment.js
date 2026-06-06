// ...existing code...
router.post('/calculate', async (req, res) => {
  const { hours, isAbono } = req.body;

  try {
    const settings = await Settings.findOne({});
    const pricePerHour = settings.pricePerHour;
    const abonoValue = settings.abonoValue;

    let total = hours * pricePerHour;
    if (isAbono) {
      total += abonoValue;
    }

    res.json({ total });
  } catch (error) {
    console.error('Error al calcular el pago:', error);
    res.status(500).json({ error: 'Error al calcular el pago' });
  }
});
// ...existing code...
