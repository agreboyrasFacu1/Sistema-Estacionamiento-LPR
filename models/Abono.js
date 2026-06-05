// ...existing code...
class Abono {
    constructor(valor, fechaInicio) {
        this.valor = valor;
        this.fechaInicio = fechaInicio || new Date();
        this.fechaFin = new Date(this.fechaInicio);
        this.fechaFin.setMonth(this.fechaInicio.getMonth() + 1);
    }

    setValor(nuevoValor) {
        this.valor = nuevoValor;
    }

    setFechaInicio() {
        throw new Error("La fecha de inicio no puede ser modificada.");
    }

    setFechaFin() {
        throw new Error("La fecha de fin no puede ser modificada.");
    }
}
// ...existing code...
