let map = L.map('map').setView([47.5, -120.5], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let geojsonLayer;
let allData;
let allCounties;

allData = summaryData;
allCounties = countiesData;
populateUtilityOptions(allData);
updateMap();


function populateUtilityOptions(data) {
  const utilities = new Set();
  data.features.forEach(f => {
    if (f.properties.utility_name) {
      utilities.add(f.properties.utility_name);
    }
  });

  const utilitySelect = document.getElementById('utilitySelect');
  utilities.forEach(util => {
    const option = document.createElement('option');
    option.value = util;
    option.text = util;
    utilitySelect.appendChild(option);
  });
}

function updateMap() {
    const selectedYear = document.getElementById('yearSelect').value;
    const selectedUtility = document.getElementById('utilitySelect').value;
    const selectedMetric = document.querySelector('input[name="metric"]:checked').value;
  
    if (geojsonLayer) {
      map.removeLayer(geojsonLayer);
    }
  
    // 建立 lookup： {county_year_utility: {total_disconnections, mape}}
    const lookup = {};
    allData.features.forEach(f => {
      const key = `${f.properties.NAME}_${f.properties.year}_${f.properties.utility_name}`;
      lookup[key] = {
        total_disconnections: f.properties.total_disconnections,
        mape: f.properties.mape
      };
    });
  
    geojsonLayer = L.geoJSON(allCounties, {
      style: function(feature) {
        const countyName = feature.properties.NAME;
  
        let value;
  
        if (selectedUtility === "All") {
          // ⭐️如果是All，找這個county這一年的所有utility資料，加總或平均
          let sum = 0;
          let count = 0;
          for (let key in lookup) {
            if (key.startsWith(`${countyName}_${selectedYear}_`)) {
              const data = lookup[key];
              if (data && data[selectedMetric] !== undefined && data[selectedMetric] !== null) {
                sum += data[selectedMetric];
                count++;
              }
            }
          }
          value = count > 0 ? sum / count : undefined; // ⭐️可以改成 sum 或 sum/count(平均)
        } else {
          const key = `${countyName}_${selectedYear}_${selectedUtility}`;
          const data = lookup[key];
          value = data ? data[selectedMetric] : undefined;
        }
  
        return {
          fillColor: (value !== undefined && value !== null) ? getColor(value, selectedMetric) : '#d3d3d3',
          weight: 1,
          opacity: 1,
          color: 'white',
          fillOpacity: 0.7
        };
      },
      onEachFeature: function(feature, layer) {
        const countyName = feature.properties.NAME;
  
        let value;
  
        if (selectedUtility === "All") {
          let sum = 0;
          let count = 0;
          for (let key in lookup) {
            if (key.startsWith(`${countyName}_${selectedYear}_`)) {
              const data = lookup[key];
              if (data && data[selectedMetric] !== undefined && data[selectedMetric] !== null) {
                sum += data[selectedMetric];
                count++;
              }
            }
          }
          value = count > 0 ? sum / count : undefined;
        } else {
          const key = `${countyName}_${selectedYear}_${selectedUtility}`;
          const data = lookup[key];
          value = data ? data[selectedMetric] : undefined;
        }
  
        layer.bindPopup(
          "County: " + countyName +
          "<br>Year: " + selectedYear +
          "<br>Utility: " + (selectedUtility !== "All" ? selectedUtility : "Multiple") +
          `<br>${selectedMetric === 'total_disconnections' ? 'Total Disconnections' : 'MAPE'}: ` +
          (value !== undefined ? value.toFixed(2) : "NA")
        );
      }
    }).addTo(map);
  }
  
  

  function getColor(d, metric) {
    if (d === undefined || d === null || isNaN(d)) {
      return '#cce5ff'; // ⭐️新的缺資料顏色
    }
  
    if (metric === 'total_disconnections') {
      return d > 2000 ? '#800026' :
             d > 1000 ? '#BD0026' :
             d > 500  ? '#E31A1C' :
             d > 200  ? '#FC4E2A' :
             d > 100  ? '#FD8D3C' :
             d > 50   ? '#FEB24C' :
             d > 0    ? '#FED976' :
                        '#FFEDA0';
    } else if (metric === 'mape') {
      return d > 50 ? '#084081' :
             d > 30 ? '#0868AC' :
             d > 20 ? '#2B8CBE' :
             d > 10 ? '#4EB3D3' :
             d > 5  ? '#7BCCC4' :
             d > 0  ? '#A8DDB5' :
                      '#CCEBC5';
    }
  }
  
  

// 加上選單 change 事件
document.getElementById('yearSelect').addEventListener('change', updateMap);
document.getElementById('utilitySelect').addEventListener('change', updateMap);
