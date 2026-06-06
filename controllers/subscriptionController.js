// ...existing code...
async function registerSubscription(req, res) {
    try {
        const { userId } = req.body;
        const config = await Config.findOne();
        const subscriptionValue = config.subscriptionValue;

        const subscription = new Subscription({
            userId,
            amount: subscriptionValue,
            date: new Date()
        });

        await subscription.save();
        res.status(201).json({ message: 'Abono registrado y cobrado', subscription });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar el abono' });
    }
}
// ...existing code...
