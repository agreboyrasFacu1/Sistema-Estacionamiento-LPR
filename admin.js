// ...existing code...
document.getElementById('save-settings').addEventListener('click', function () {
  const abonoValue = document.getElementById('abono-value').value;
  const pricePerHour = document.getElementById('price-per-hour').value;

  fetch('/api/admin/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pricePerHour: pricePerHour,
      abonoValue: abonoValue,
    }),
  })
    .then(response => response.json())
    .then(data => {
      alert('Configuración guardada correctamente');
    })
    .catch(error => {
      console.error('Error al guardar la configuración:', error);
    });
});
// ...existing code...
