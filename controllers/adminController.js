// ...existing code...
async function updateSubscriptionValue(req, res) {
    try {
        const { newValue } = req.body;
        if (!newValue || newValue <= 0) {
            return res.status(400).json({ error: 'Valor inválido para el abono' });
        }
        const config = await Config.findOneAndUpdate({}, { subscriptionValue: newValue }, { new: true });
        res.status(200).json({ message: 'Valor del abono actualizado', config });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el valor del abono' });
    }
}
// ...existing code...
