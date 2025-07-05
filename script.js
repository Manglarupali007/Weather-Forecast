const apiKey = "c0445327ec5f51901ce7a0c250a66b09";
    const defaultCity = "New York";
    let map;
    
    // Initialize app
    document.addEventListener('DOMContentLoaded', () => {
      // Load saved theme
      if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
      }
      
      // Initialize map
      initMap();
      
      // Set up navigation
      setupNavigation();
      
      // Load last searched city or default
      const savedCity = localStorage.getItem("lastCity") || defaultCity;
      document.getElementById('cityInput').value = savedCity;
      getWeather(savedCity);
    });
    
    // Initialize map
    function initMap() {
      map = L.map('map').setView([20, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add weather tile layers (example layers - in reality you'd use weather-specific tiles)
      L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=' + apiKey, {
        maxZoom: 19,
        opacity: 0.7
      }).addTo(map);
      
      // Map type buttons
      document.querySelectorAll('.map-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const type = this.dataset.type;
          changeMapType(type);
        });
      });
    }
    
    function changeMapType(type) {
      // Clear existing weather layers
      map.eachLayer(layer => {
        if (layer instanceof L.TileLayer && layer.options.attribution.includes('OpenWeatherMap')) {
          map.removeLayer(layer);
        }
      });
      
      // Add new layer based on type
      let layerUrl;
      switch(type) {
        case 'temp':
          layerUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`;
          break;
        case 'precipitation':
          layerUrl = `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`;
          break;
        case 'wind':
          layerUrl = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`;
          break;
        case 'clouds':
          layerUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`;
          break;
      }
      
      if (layerUrl) {
        L.tileLayer(layerUrl, {
          maxZoom: 19,
          opacity: 0.7
        }).addTo(map);
      }
    }
    
    // Set up navigation
    function setupNavigation() {
      const navLinks = document.querySelectorAll('.nav-link');
      
      navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const pageId = this.dataset.page + '-page';
          
          // Update active link
          navLinks.forEach(navLink => navLink.classList.remove('active'));
          this.classList.add('active');
          
          // Show selected page
          document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
          });
          document.getElementById(pageId).classList.add('active');
        });
      });
    }
    
    // Get weather for a city
    function getWeather(city = null) {
      const cityInput = city || document.getElementById('cityInput').value;
      if (!cityInput.trim()) return;
      
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&appid=${apiKey}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityInput}&appid=${apiKey}&units=metric`;
      
      // Show loader, hide content and error
      document.getElementById('loader').style.display = 'block';
      document.getElementById('currentWeather').style.display = 'none';
      document.getElementById('forecastContainer').style.display = 'none';
      document.getElementById('error').style.display = 'none';
      
      // Fetch current weather
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          if (data.cod !== 200) {
            throw new Error(data.message);
          }
          
          displayCurrentWeather(data);
          // Save city to localStorage
          localStorage.setItem("lastCity", data.name);
          
          // Fetch forecast data
          return fetch(forecastUrl);
        })
        .then(response => response.json())
        .then(forecastData => {
          if (forecastData.cod !== "200") {
            throw new Error(forecastData.message);
          }
          
          displayForecast(forecastData);
          document.getElementById('loader').style.display = 'none';
        })
        .catch(err => {
          document.getElementById('loader').style.display = 'none';
          document.getElementById('error').style.display = 'block';
          document.getElementById('error').innerHTML = `
            <strong>Error!</strong> ${err.message || 'City not found. Please try another location.'}
          `;
          console.error("API Error:", err);
        });
    }
    
    // Display current weather
    function displayCurrentWeather(data) {
      document.getElementById('location').textContent = `${data.name}, ${data.sys.country}`;
      document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
      document.getElementById('description').textContent = data.weather[0].description;
      document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
      
      document.getElementById('wind').textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
      document.getElementById('humidity').textContent = `${data.main.humidity}%`;
      document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
      document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
      document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
      
      // Simple UV index simulation (not provided by free API)
      const uvIndex = Math.min(10, Math.floor(Math.random() * 6) + 3);
      const uvLevel = uvIndex < 3 ? 'Low' : uvIndex < 6 ? 'Moderate' : uvIndex < 8 ? 'High' : 'Very High';
      document.getElementById('uvIndex').textContent = `${uvIndex} ${uvLevel}`;
      
      document.getElementById('currentWeather').style.display = 'grid';
    }
    
    // Display 5-day forecast
    function displayForecast(forecastData) {
      const forecastCards = document.getElementById('forecastCards');
      forecastCards.innerHTML = '';
      
      // Group forecasts by day
      const dailyForecasts = {};
      forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (!dailyForecasts[day]) {
          dailyForecasts[day] = {
            date: dateStr,
            temps: [],
            icon: item.weather[0].icon,
            description: item.weather[0].description
          };
        }
        
        dailyForecasts[day].temps.push(item.main.temp);
      });
      
      // Create forecast cards for the next 5 days
      let dayCount = 0;
      for (const day in dailyForecasts) {
        if (dayCount >= 5) break;
        
        const forecast = dailyForecasts[day];
        const minTemp = Math.min(...forecast.temps);
        const maxTemp = Math.max(...forecast.temps);
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
          <div class="forecast-date">${day}<br><small>${forecast.date}</small></div>
          <img src="https://openweathermap.org/img/wn/${forecast.icon}@2x.png" 
               alt="${forecast.description}" class="forecast-icon">
          <div class="forecast-description">${forecast.description}</div>
          <div class="forecast-temp">${Math.round(maxTemp)}°C</div>
          <div class="forecast-low">${Math.round(minTemp)}°C</div>
        `;
        
        forecastCards.appendChild(card);
        dayCount++;
      }
      
      document.getElementById('forecastContainer').style.display = 'block';
    }
    
    // Get location from browser
    function getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
            
            document.getElementById('loader').style.display = 'block';
            
            fetch(apiUrl)
              .then(response => response.json())
              .then(data => {
                document.getElementById('cityInput').value = data.name;
                getWeather(data.name);
              })
              .catch(err => {
                document.getElementById('loader').style.display = 'none';
                document.getElementById('error').style.display = 'block';
                console.error("Geolocation Error:", err);
              });
          },
          error => {
            alert("Geolocation error: " + error.message);
          }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
      }
    }
    
    // Toggle dark/light mode
    function toggleTheme() {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
    }
    
    // Handle Enter key in search
    document.getElementById('cityInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        getWeather();
      }
    });
    
    // Handle contact form submission
    document.getElementById('contactForm').addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Thank you for your message! We will get back to you soon.');
      this.reset();
    });

   
  (function(){
    emailjs.init("JvC6HMd-zwoNlFQF2"); // Replace with your actual public key
  })();
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Show a loading or sending message (optional)
    
    emailjs.sendForm('service_8i4g6fs', 'template_bqteb1j', this)
      .then(function(response) {
        alert("✅ Message sent successfully!");
        document.getElementById("contactForm").reset();
      }, function(error) {
        alert("❌ Failed to send message. Please try again.");
        console.log('FAILED...', error);
      });
  });
