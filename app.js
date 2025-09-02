// Pažymėk aktyvų punktą pagal body data-page
(() => {
  const page = document.body.dataset.page;
  document.querySelectorAll('.topnav a[data-nav]').forEach(a => {
    a.dataset.active = (a.dataset.nav === page) ? "1" : "0";
  });
})();
