// soul-chart.js — Soulink (polished)
// Renders three charts from localStorage 'soulQuiz':
// - Love Language Focus (radar)
// - Hobbies Mix (doughnut)
// - Core Values Balance (radar)

(() => {
  const KEY = "soulQuiz";

  const teal = "rgba(0, 253, 216, 1)";
  const tealFill = "rgba(0, 253, 216, 0.25)";
  const tealStroke = "rgba(0, 253, 216, 0.6)";
  const grey = "rgba(210, 255, 255, 0.4)";

  let charts = [];

  function loadProfile() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch { return {}; }
  }

  function destroyCharts() {
    charts.forEach(ch => ch?.destroy?.());
    charts = [];
  }

  function loveLanguageVector(primary) {
    const labels = [
      "Words of Affirmation",
      "Acts of Service",
      "Receiving Gifts",
      "Quality Time",
      "Physical Touch",
    ];
    const data = labels.map(ll => (primary && ll === primary) ? 100 : 20);
    return { labels, data };
  }

  // Group hobbies into themes (change easily later)
  function hobbyBuckets(arr) {
    const groups = {
      Creative: ["Art", "Music", "Creativity"],
      Active: ["Sports", "Dancing", "Traveling"],
      Mindful: ["Meditation", "Reading", "Nature Walks"],
      Cozy: ["Cooking", "Gaming"],
    };
    const counts = { Creative: 0, Active: 0, Mindful: 0, Cozy: 0 };
    (arr || []).forEach(h => {
      Object.entries(groups).forEach(([k, list]) => {
        if (list.includes(h)) counts[k] += 1;
      });
    });
    const labels = Object.keys(counts);
    const data = labels.map(k => counts[k]);
    return { labels, data };
  }

  // Map values into Heart/Mind/Spirit triad
  function valuesBalance(values) {
    const map = {
      Heart: ["Kindness", "Empathy", "Loyalty", "Honesty"],
      Mind: ["Creativity", "Balance", "Freedom"],
      Spirit: ["Spirituality", "Growth", "Adventure"],
    };
    const score = { Heart: 0, Mind: 0, Spirit: 0 };
    (values || []).forEach(v => {
      Object.entries(map).forEach(([k, list]) => { if (list.includes(v)) score[k] += 1; });
    });
    const labels = Object.keys(score);
    const data = labels.map(k => score[k] * 20); // scale to 0–100
    return { labels, data };
  }

  function render() {
    destroyCharts();

    const profile = loadProfile();
    const name = (profile.name || "Friend").split(" ")[0];
    const ll = loveLanguageVector(profile.loveLanguage);
    const hb = hobbyBuckets(profile.hobbies || []);
    const vb = valuesBalance(profile.values || []);

    // hint text
    const hint = document.getElementById("ll-hint");
    if (hint) hint.textContent = profile.loveLanguage
      ? `Primary: ${profile.loveLanguage}`
      : "No love language selected yet. Set it in Edit Profile.";

    // Love Language (radar)
    const loveLangChart = new Chart(document.getElementById("loveLangChart"), {
      type: "radar",
      data: {
        labels: ll.labels,
        datasets: [{
          label: `${name}'s Focus`,
          data: ll.data,
          fill: true,
          backgroundColor: tealFill,
          borderColor: tealStroke,
          pointBackgroundColor: teal,
          pointBorderColor: "#fff",
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            suggestedMax: 100,
            ticks: { display: false },
            grid: { color: "rgba(210, 255, 255, 0.15)" },
            angleLines: { color: "rgba(210, 255, 255, 0.15)" },
            pointLabels: { color: "#dff" }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      }
    });
    charts.push(loveLangChart);

    // Hobbies (doughnut)
    const hobbiesChart = new Chart(document.getElementById("hobbiesChart"), {
      type: "doughnut",
      data: {
        labels: hb.labels,
        datasets: [{
          data: hb.data,
          backgroundColor: [
            "rgba(0, 253, 216, 0.35)",
            "rgba(0, 253, 216, 0.25)",
            "rgba(0, 253, 216, 0.18)",
            "rgba(0, 253, 216, 0.12)"
          ],
          borderColor: tealStroke,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        cutout: "55%",
        plugins: {
          legend: { labels: { color: "#dff" } },
          tooltip: { enabled: true }
        }
      }
    });
    charts.push(hobbiesChart);

    // Values (radar Heart/Mind/Spirit)
    const valuesChart = new Chart(document.getElementById("valuesChart"), {
      type: "radar",
      data: {
        labels: vb.labels,
        datasets: [{
          label: "Balance",
          data: vb.data,
          fill: true,
          backgroundColor: tealFill,
          borderColor: tealStroke,
          pointBackgroundColor: teal,
          pointBorderColor: "#fff",
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            suggestedMax: 100,
            ticks: { display: false },
            grid: { color: "rgba(210, 255, 255, 0.15)" },
            angleLines: { color: "rgba(210, 255, 255, 0.15)" },
            pointLabels: { color: "#dff" }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      }
    });
    charts.push(valuesChart);
  }

  // initial render + refresh button
  render();
  document.getElementById("refreshCharts")?.addEventListener("click", render);
})();
