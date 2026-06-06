// ...existing code...
const ConfigSchema = new mongoose.Schema({
    // ...existing fields...
    subscriptionValue: {
        type: Number,
        required: true,
        default: 1000 // Valor inicial del abono
    }
});
// ...existing code...
