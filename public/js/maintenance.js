const maintenanceMode = false; 

if (maintenanceMode && !window.location.pathname.endsWith('/503.html')) {
  window.location.replace('/503.html');
}
