// ...existing code...
updateAbono(req, res) {
    const { id, nuevoValor } = req.body;
    const abono = Abono.findById(id);

    if (!abono) {
        return res.status(404).send("Abono no encontrado.");
    }

    try {
        abono.setValor(nuevoValor);
        res.status(200).send("Valor del abono actualizado correctamente.");
    } catch (error) {
        res.status(400).send(error.message);
    }
}
// ...existing code...
