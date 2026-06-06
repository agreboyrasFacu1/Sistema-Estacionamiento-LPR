// ...existing code...
async function getVehicles(req, res) {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 }); // Orden descendente
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los vehículos' });
    }
}
// ...existing code...
