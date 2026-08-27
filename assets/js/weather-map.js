/**
 * Weather Component - Handles fetching and rendering weather data for Legazpi City
 * using Open-Meteo API. Interactive and MECE design.
 */

(function () {
  'use strict';

  // ============================================================================
  // Mock Data & Utilities
  // ============================================================================
  function getMockWeather() {
    return {
      temperature: 31,
      humidity: 78,
      windSpeed: 12,
      uvIndex: 8,
      precipitationProb: 40,
      condition: 'Partly Cloudy',
      icon: 'bi-cloud-sun',
      isFallback: true,
      timestamp: Date.now(),
      hourly: [
        { time: '12 PM', temp: 31, icon: 'bi-cloud-sun' },
        { time: '1 PM', temp: 32, icon: 'bi-sun' },
        { time: '2 PM', temp: 33, icon: 'bi-sun' },
        { time: '3 PM', temp: 31, icon: 'bi-cloud-rain' },
        { time: '4 PM', temp: 29, icon: 'bi-cloud-rain' },
      ]
    };
  }

  // ============================================================================
  // Weather Service
  // ============================================================================
  const WeatherService = {
    COORDINATES: { lat: 13.1391, lon: 123.7438 }, // Legazpi City Hall
    API_URL: 'https://api.open-meteo.com/v1/forecast',
    CACHE_KEY: 'legazpi_weather_cache_v3',
    CACHE_DURATION: 15 * 60 * 1000, // 15 minutes

    mapWeatherCode(code) {
      const weatherMap = {
        0: { condition: 'Clear sky', icon: 'bi-sun' },
        1: { condition: 'Mainly clear', icon: 'bi-sun' },
        2: { condition: 'Partly cloudy', icon: 'bi-cloud-sun' },
        3: { condition: 'Overcast', icon: 'bi-cloudy' },
        45: { condition: 'Fog', icon: 'bi-cloud-fog' },
        48: { condition: 'Depositing rime fog', icon: 'bi-cloud-fog' },
        51: { condition: 'Light drizzle', icon: 'bi-cloud-drizzle' },
        53: { condition: 'Moderate drizzle', icon: 'bi-cloud-drizzle' },
        55: { condition: 'Dense drizzle', icon: 'bi-cloud-drizzle' },
        61: { condition: 'Slight rain', icon: 'bi-cloud-rain' },
        63: { condition: 'Moderate rain', icon: 'bi-cloud-rain' },
        65: { condition: 'Heavy rain', icon: 'bi-cloud-rain-heavy' },
        71: { condition: 'Slight snow', icon: 'bi-cloud-snow' },
        73: { condition: 'Moderate snow', icon: 'bi-cloud-snow' },
        75: { condition: 'Heavy snow', icon: 'bi-cloud-snow' },
        77: { condition: 'Snow grains', icon: 'bi-cloud-snow' },
        80: { condition: 'Slight rain showers', icon: 'bi-cloud-rain' },
        81: { condition: 'Moderate rain showers', icon: 'bi-cloud-rain-heavy' },
        82: { condition: 'Violent rain showers', icon: 'bi-cloud-lightning-rain' },
        95: { condition: 'Thunderstorm', icon: 'bi-cloud-lightning' },
        96: { condition: 'Thunderstorm with slight hail', icon: 'bi-cloud-lightning-rain' },
        99: { condition: 'Thunderstorm with heavy hail', icon: 'bi-cloud-lightning-rain' },
      };
      return weatherMap[code] || { condition: 'Unknown', icon: 'bi-cloud' };
    },

    getCachedWeather() {
      try {
        const cached = localStorage.getItem(this.CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Weather: Cache read failed', e);
      }
      return null;
    },

    cacheWeather(data) {
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Weather: Cache write failed', e);
      }
    },

    async fetchWeather() {
      // Use fallback for local files to avoid CORS
      if (window.location.protocol === 'file:') {
        return getMockWeather();
      }

      const cached = this.getCachedWeather();
      if (cached) {
        return cached;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const params = new URLSearchParams({
          latitude: this.COORDINATES.lat,
          longitude: this.COORDINATES.lon,
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,uv_index',
          hourly: 'temperature_2m,weather_code',
          forecast_hours: '24', // Fetch 24 hours to filter current + next few
          timezone: 'Asia/Manila',
        });

        const apiUrl = `${this.API_URL}?${params}`;

        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const apiData = await response.json();
        const weatherData = this.transformApiResponse(apiData);
        this.cacheWeather(weatherData);
        return weatherData;
      } catch (error) {
        console.warn('Weather: API fetch failed, using mock data -', error.message);
        return getMockWeather();
      }
    },

    transformApiResponse(apiData) {
      try {
        const current = apiData.current;
        const hourly = apiData.hourly;
        const { condition, icon } = this.mapWeatherCode(current.weather_code);

        // Process hourly data
        const currentHour = new Date(current.time || Date.now()).getHours();
        const hourlyForecast = [];
        let count = 0;
        
        if (hourly && hourly.time) {
           for (let i = 0; i < hourly.time.length; i++) {
             const timeDate = new Date(hourly.time[i]);
             const hour = timeDate.getHours();
             // Get next 5 hours including current
             if (timeDate >= new Date() - 3600000 && count < 5) {
                const hourIcon = this.mapWeatherCode(hourly.weather_code[i]).icon;
                let timeStr = 'Now';
                if (count > 0) {
                    timeStr = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                }
                hourlyForecast.push({
                   time: timeStr,
                   temp: Math.round(hourly.temperature_2m[i]),
                   icon: hourIcon
                });
                count++;
             }
           }
        }

        return {
          temperature: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          uvIndex: current.uv_index !== undefined ? current.uv_index : 0,
          precipitationProb: current.precipitation_probability !== undefined ? current.precipitation_probability : 0,
          condition,
          icon,
          hourly: hourlyForecast.length > 0 ? hourlyForecast : getMockWeather().hourly,
          isFallback: false,
          timestamp: Date.now(),
        };
      } catch (e) {
        console.warn('Weather: Transform failed, using mock', e);
        return getMockWeather();
      }
    },
  };

  // ============================================================================
  // AI-Assisted Content Generator (MECE logic)
  // ============================================================================
  const WeatherAssistant = {
    generateInsights(data) {
      let summary = "";
      let actions = [];

      // Logic based on temperature, rain probability, and UV
      const isRaining = data.precipitationProb > 40 || data.condition.toLowerCase().includes('rain');
      const isHot = data.temperature >= 32;
      const highUV = data.uvIndex >= 6;

      // Summary
      if (isRaining) {
        summary = "It's looking quite wet outside right now. Expect rain and potentially lower visibility. Best to stay dry indoors if you don't need to be out.";
      } else if (isHot && highUV) {
        summary = "It's a hot and sunny day in Legazpi! The sun is quite intense, making it a great day for indoor activities or shaded outdoor spots.";
      } else if (data.temperature < 25) {
        summary = "It's relatively cool today for Legazpi. A comfortable time to be outside and enjoy the breeze.";
      } else {
        summary = "It's a standard, pleasant day in the city. The weather is relatively calm with manageable conditions for most activities.";
      }

      // Action 1: Laundry (Incorporate Humidity)
      if (isRaining) {
        actions.push({ icon: 'bi-droplet-half', title: 'Laundry', desc: 'Not recommended. Keep clothes indoors.', status: 'danger' });
      } else if (data.humidity > 85) {
        actions.push({ icon: 'bi-cloud-sun', title: 'Laundry', desc: `Will take longer to dry (Humidity: ${data.humidity}%).`, status: 'warning' });
      } else {
        actions.push({ icon: 'bi-brightness-high', title: 'Laundry', desc: `Good drying conditions (Humidity: ${data.humidity}%).`, status: 'success' });
      }

      // Action 2: Outdoors (Incorporate Rain Prob / Temp)
      if (isRaining) {
        actions.push({ icon: 'bi-umbrella', title: 'Outdoors', desc: `Bring an umbrella (${data.precipitationProb}% rain chance).`, status: 'danger' });
      } else if (isHot) {
        actions.push({ icon: 'bi-thermometer-sun', title: 'Outdoors', desc: 'Quite hot, avoid strenuous activities.', status: 'warning' });
      } else {
        actions.push({ icon: 'bi-tree', title: 'Outdoors', desc: `Great conditions for a walk outside (${data.precipitationProb}% rain chance).`, status: 'success' });
      }

      // Action 3: UV / Sun Protection (Incorporate UV / Wind)
      if (highUV) {
        actions.push({ icon: 'bi-sunglasses', title: 'Sun Protection', desc: `High UV (${data.uvIndex}). Sunscreen is a must.`, status: 'danger' });
      } else if (data.uvIndex >= 3) {
        actions.push({ icon: 'bi-sunglasses', title: 'Sun Protection', desc: `Moderate UV (${data.uvIndex}). Wear some sun protection.`, status: 'warning' });
      } else {
        actions.push({ icon: 'bi-shield-check', title: 'Sun Protection', desc: `Low UV index (${data.uvIndex}). Wind: ${data.windSpeed} km/h.`, status: 'success' });
      }

      return { summary, actions };
    }
  };

  // ============================================================================
  // Weather UI - Renders weather data into the DOM
  // ============================================================================
  const WeatherUI = {
    render(container, data) {
      if (!container) return;

      try {
        const insights = WeatherAssistant.generateInsights(data);

        const actionsHTML = insights.actions.map(action => `
          <div class="weather-action-card border-${action.status}">
            <div class="action-icon text-${action.status}">
              <i class="bi ${action.icon}"></i>
            </div>
            <div class="action-text">
              <strong>${action.title}</strong>
              <p>${action.desc}</p>
            </div>
          </div>
        `).join('');
        
        const hourlyHTML = (data.hourly || []).map(hour => `
          <div class="weather-hour-card">
            <span class="hour-time">${hour.time}</span>
            <div class="hour-icon-wrapper" style="color: ${hour.color || 'var(--color-primary)'}">
              <i class="bi ${hour.icon}"></i>
            </div>
            <span class="hour-temp">${hour.temp}°</span>
          </div>
        `).join('');

        container.innerHTML = `
          <div class="premium-weather-widget" id="interactive-weather-widget" role="button" tabindex="0" aria-expanded="false" aria-label="Current weather in Legazpi City. Click to expand for details.">
              <!-- Premium Background Gradient -->
              <div class="premium-weather-bg"></div>

              <!-- Concise Top Section -->
              <div class="weather-header">
                  <div class="weather-current-icon" aria-hidden="true" style="color: ${data.color || 'var(--color-primary)'}">
                      <i class="bi ${data.icon}"></i>
                  </div>
                  <div class="weather-current-info">
                      <div class="weather-current-temp">${data.temperature}°C</div>
                      <div class="weather-current-condition">${data.condition}</div>
                  </div>
                  <div class="weather-expand-indicator">
                    <i class="bi bi-chevron-down indicator-icon"></i>
                  </div>
              </div>

              <!-- AI Summary (Visible on desktop by default, collapsed on mobile) -->
              <div class="weather-desktop-visible">
                  <div class="weather-ai-summary">
                    <div class="ai-summary-icon">
                       <i class="bi bi-stars"></i>
                    </div>
                    <div class="ai-summary-text">
                      <p>${insights.summary}</p>
                    </div>
                  </div>
              </div>
              
              <!-- Comprehensive Section (Always collapsed by default) -->
              <div class="weather-expanded-content">
                  
                  <!-- Actionable Items (MECE: incorporates stats) -->
                  <div class="weather-actions-grid">
                      ${actionsHTML}
                  </div>
                  
                  <!-- Hourly Forecast -->
                  <div class="weather-hourly-container">
                      <h4 class="weather-hourly-title">Next 5 Hours</h4>
                      <div class="weather-hourly-scroll">
                          ${hourlyHTML}
                      </div>
                  </div>
              </div>

              <!-- Official Link (Visible on desktop by default, collapsed on mobile) -->
              <div class="weather-desktop-visible">
                  <div class="weather-footer">
                    <a href="https://www.panahon.gov.ph/" target="_blank" rel="noopener noreferrer">Official PAGASA Updates <i class="bi bi-box-arrow-up-right"></i></a>
                  </div>
              </div>
          </div>
        `;

        const widget = container.querySelector('#interactive-weather-widget');
        if (widget) {
            widget.addEventListener('click', function(e) {
                // Prevent links from toggling
                if (e.target.tagName === 'A' || e.target.closest('a')) return;
                
                const isExpanded = this.classList.contains('is-expanded');
                if (isExpanded) {
                    this.classList.remove('is-expanded');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    this.classList.add('is-expanded');
                    this.setAttribute('aria-expanded', 'true');
                }
            });
            widget.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        }

        container.setAttribute('data-weather-loaded', 'true');
      } catch (e) {
        console.error('Weather: Render failed', e);
        this.renderError(container);
      }
    },


    renderLoading(container) {
      if (!container) return;
      container.innerHTML = `
            <div class="premium-weather-widget is-loading" aria-busy="true" aria-label="Loading weather data">
                <div class="weather-header">
                    <div class="skeleton-circle"></div>
                    <div class="weather-current-info" style="width: 100%;">
                        <div class="skeleton-text skeleton-lg" style="margin-bottom: 8px;"></div>
                        <div class="skeleton-text skeleton-md"></div>
                    </div>
                </div>
            </div>
        `;
    },

    renderError(container) {
      if (!container) return;
      container.innerHTML = `
            <div class="premium-weather-widget is-error" role="alert">
                <div class="weather-error-content">
                    <i class="bi bi-cloud-slash" aria-hidden="true"></i>
                    <p>Weather data unavailable</p>
                    <button type="button" class="btn btn-sm btn-primary weather-retry-btn" onclick="window.WeatherMapInit && window.WeatherMapInit()">
                        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Retry
                    </button>
                </div>
            </div>
        `;
      container.setAttribute('data-weather-loaded', 'error');
    },
  };

  // ============================================================================
  // Main Initialization Function
  // ============================================================================
  async function WeatherMapInit() {
    console.log('Weather: Initializing Legazpi widgets...');

    const weatherContainer = document.getElementById('weather-container');

    // WEATHER: Show loading, then fetch
    if (weatherContainer) {
      try {
        WeatherUI.renderLoading(weatherContainer);
        const data = await WeatherService.fetchWeather();
        WeatherUI.render(weatherContainer, data);
      } catch (error) {
        console.error('Weather: Init failed', error);
        WeatherUI.render(weatherContainer, getMockWeather());
      }
    }
  }

  // Expose for retry button and failsafe
  window.WeatherMapInit = WeatherMapInit;

  // ============================================================================
  // Auto-initialization
  // ============================================================================
  (function () {
    function init() {
      WeatherMapInit();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();

  // Export for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeatherService, WeatherAssistant, WeatherUI, getMockWeather };
  }
})();
