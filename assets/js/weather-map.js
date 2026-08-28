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
      scene: 'cloudy',
      isDay: new Date().getHours() >= 6 && new Date().getHours() < 18,
      daily: [
        { label: 'Tue', icon: 'bi-cloud-sun', scene: 'cloudy', max: 32, min: 25 },
        { label: 'Wed', icon: 'bi-cloud-rain', scene: 'rain', max: 30, min: 25 },
        { label: 'Thu', icon: 'bi-cloud-rain', scene: 'rain', max: 29, min: 24 },
        { label: 'Fri', icon: 'bi-sun', scene: 'clear', max: 32, min: 25 },
        { label: 'Sat', icon: 'bi-cloud-sun', scene: 'cloudy', max: 31, min: 25 },
      ],
      rainOutlook: { time: '3 PM', chance: 60 },
      isFallback: true,
      timestamp: Date.now(),
      hourly: [
        { time: '12 PM', temp: 31, icon: 'bi-cloud-sun' },
        { time: '1 PM', temp: 32, icon: 'bi-sun' },
        { time: '2 PM', temp: 33, icon: 'bi-sun' },
        { time: '3 PM', temp: 31, icon: 'bi-cloud-rain' },
        { time: '4 PM', temp: 29, icon: 'bi-cloud-rain' },
      ],
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

    /**
     * Collapse the WMO code to one of four illustrated scenes. Day and night
     * share a scene and differ only by palette, which is why there are four
     * of these rather than eight.
     */
    mapScene(code) {
      if (code === 95 || code === 96 || code === 99) return 'storm';
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
      if (code === 0 || code === 1) return 'clear';
      return 'cloudy';
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
          current:
            'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,uv_index,is_day',
          hourly: 'temperature_2m,weather_code,precipitation_probability',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min',
          forecast_hours: '24', // Fetch 24 hours to filter current + next few
          forecast_days: '6', // Today plus the five-day strip
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
                timeStr =
                  hour === 0
                    ? '12 AM'
                    : hour === 12
                      ? '12 PM'
                      : hour > 12
                        ? `${hour - 12} PM`
                        : `${hour} AM`;
              }
              hourlyForecast.push({
                time: timeStr,
                temp: Math.round(hourly.temperature_2m[i]),
                icon: hourIcon,
              });
              count++;
            }
          }
        }

        // Five-day outlook. Index 0 is today, which the current conditions
        // already cover, so the strip starts at tomorrow.
        const daily = apiData.daily;
        const dailyForecast = [];
        if (daily && daily.time) {
          for (let i = 1; i < daily.time.length && dailyForecast.length < 5; i++) {
            const day = new Date(daily.time[i] + 'T00:00:00');
            dailyForecast.push({
              label: day.toLocaleDateString('en-PH', { weekday: 'short' }),
              icon: this.mapWeatherCode(daily.weather_code[i]).icon,
              scene: this.mapScene(daily.weather_code[i]),
              max: Math.round(daily.temperature_2m_max[i]),
              min: Math.round(daily.temperature_2m_min[i]),
            });
          }
        }

        // Rain outlook: the first hour in the next twelve where the chance of
        // rain crosses 50%. This is the genuinely useful line in Bicol.
        let rainOutlook = null;
        if (hourly && hourly.time && hourly.precipitation_probability) {
          const now = Date.now();
          for (let i = 0; i < hourly.time.length; i++) {
            const when = new Date(hourly.time[i]);
            const hoursAway = (when - now) / 3600000;
            if (hoursAway <= 0 || hoursAway > 12) continue;
            if (hourly.precipitation_probability[i] >= 50) {
              const h = when.getHours();
              rainOutlook = {
                time: h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`,
                chance: hourly.precipitation_probability[i],
              };
              break;
            }
          }
        }

        return {
          temperature: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          uvIndex: current.uv_index !== undefined ? current.uv_index : 0,
          precipitationProb:
            current.precipitation_probability !== undefined ? current.precipitation_probability : 0,
          condition,
          icon,
          scene: this.mapScene(current.weather_code),
          isDay: current.is_day === undefined ? true : current.is_day === 1,
          hourly: hourlyForecast.length > 0 ? hourlyForecast : getMockWeather().hourly,
          daily: dailyForecast,
          rainOutlook,
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
      let summary = '';
      let actions = [];

      // Logic based on temperature, rain probability, and UV
      const isRaining =
        data.precipitationProb > 40 || data.condition.toLowerCase().includes('rain');
      const isHot = data.temperature >= 32;
      const highUV = data.uvIndex >= 6;

      // Summary
      if (isRaining) {
        summary =
          "It's looking quite wet outside right now. Expect rain and potentially lower visibility. Best to stay dry indoors if you don't need to be out.";
      } else if (isHot && highUV) {
        summary =
          "It's a hot and sunny day in Legazpi! The sun is quite intense, making it a great day for indoor activities or shaded outdoor spots.";
      } else if (data.temperature < 25) {
        summary =
          "It's relatively cool today for Legazpi. A comfortable time to be outside and enjoy the breeze.";
      } else {
        summary =
          "It's a standard, pleasant day in the city. The weather is relatively calm with manageable conditions for most activities.";
      }

      // Action 1: Laundry (Incorporate Humidity)
      if (isRaining) {
        actions.push({
          icon: 'bi-droplet-half',
          title: 'Laundry',
          desc: 'Not recommended. Keep clothes indoors.',
          status: 'danger',
        });
      } else if (data.humidity > 85) {
        actions.push({
          icon: 'bi-cloud-sun',
          title: 'Laundry',
          desc: `Will take longer to dry (Humidity: ${data.humidity}%).`,
          status: 'warning',
        });
      } else {
        actions.push({
          icon: 'bi-brightness-high',
          title: 'Laundry',
          desc: `Good drying conditions (Humidity: ${data.humidity}%).`,
          status: 'success',
        });
      }

      // Action 2: Outdoors (Incorporate Rain Prob / Temp)
      if (isRaining) {
        actions.push({
          icon: 'bi-umbrella',
          title: 'Outdoors',
          desc: `Bring an umbrella (${data.precipitationProb}% rain chance).`,
          status: 'danger',
        });
      } else if (isHot) {
        actions.push({
          icon: 'bi-thermometer-sun',
          title: 'Outdoors',
          desc: 'Quite hot, avoid strenuous activities.',
          status: 'warning',
        });
      } else {
        actions.push({
          icon: 'bi-tree',
          title: 'Outdoors',
          desc: `Great conditions for a walk outside (${data.precipitationProb}% rain chance).`,
          status: 'success',
        });
      }

      // Action 3: UV / Sun Protection (Incorporate UV / Wind)
      if (highUV) {
        actions.push({
          icon: 'bi-sunglasses',
          title: 'Sun Protection',
          desc: `High UV (${data.uvIndex}). Sunscreen is a must.`,
          status: 'danger',
        });
      } else if (data.uvIndex >= 3) {
        actions.push({
          icon: 'bi-sunglasses',
          title: 'Sun Protection',
          desc: `Moderate UV (${data.uvIndex}). Wear some sun protection.`,
          status: 'warning',
        });
      } else {
        actions.push({
          icon: 'bi-shield-check',
          title: 'Sun Protection',
          desc: `Low UV index (${data.uvIndex}). Wind: ${data.windSpeed} km/h.`,
          status: 'success',
        });
      }

      return { summary, actions };
    },

    /**
     * A soft, observational advisory. This is deliberately NOT a warning:
     * PAGASA issues warnings, we only report what the numbers currently say,
     * and we always point at PAGASA for the authoritative bulletin. Wording
     * that implies official authority would be a real hazard during an actual
     * typhoon, so it is phrased as an observation and nothing more.
     */
    generateAdvisory(data) {
      if (data.windSpeed >= 62 || data.precipitationProb >= 80) {
        return {
          level: 'high',
          text: `Winds are around ${data.windSpeed} km/h with a ${data.precipitationProb}% chance of rain right now.`,
        };
      }
      if (data.windSpeed >= 39 || data.precipitationProb >= 60) {
        return {
          level: 'watch',
          text: `Conditions are unsettled: ${data.windSpeed} km/h winds, ${data.precipitationProb}% chance of rain.`,
        };
      }
      return null;
    },
  };

  // ============================================================================
  // Weather UI - Renders weather data into the DOM
  // ============================================================================
  const WeatherUI = {
    render(container, data) {
      if (!container) return;

      try {
        const insights = WeatherAssistant.generateInsights(data);

        const actionsHTML = insights.actions
          .map(
            (action) => `
          <div class="weather-action-card border-${action.status}">
            <div class="action-icon text-${action.status}">
              <i class="bi ${action.icon}"></i>
            </div>
            <div class="action-text">
              <strong>${action.title}</strong>
              <p>${action.desc}</p>
            </div>
          </div>
        `
          )
          .join('');

        const hourlyHTML = (data.hourly || [])
          .map(
            (hour) => `
          <div class="weather-hour-card">
            <span class="hour-time">${hour.time}</span>
            <div class="hour-icon-wrapper" style="color: ${hour.color || 'var(--color-primary)'}">
              <i class="bi ${hour.icon}"></i>
            </div>
            <span class="hour-temp">${hour.temp}°</span>
          </div>
        `
          )
          .join('');

        const advisory = WeatherAssistant.generateAdvisory(data);

        const dailyHTML = (data.daily || [])
          .map(
            (day) => `
          <div class="weather-day-card">
            <span class="weather-day-label">${day.label}</span>
            <i class="bi ${day.icon} weather-day-icon" aria-hidden="true"></i>
            <span class="weather-day-temps">
              <strong>${day.max}&deg;</strong><span class="weather-day-min">${day.min}&deg;</span>
            </span>
            <span class="weather-day-range" aria-hidden="true"></span>
          </div>
        `
          )
          .join('');

        const rainHTML = data.rainOutlook
          ? `<p class="weather-rain-outlook">
               <i class="bi bi-umbrella" aria-hidden="true"></i>
               Rain likely around ${data.rainOutlook.time} (${data.rainOutlook.chance}% chance).
             </p>`
          : `<p class="weather-rain-outlook weather-rain-outlook--dry">
               <i class="bi bi-check2" aria-hidden="true"></i>
               No rain expected in the next 12 hours.
             </p>`;

        const advisoryHTML = advisory
          ? `<div class="weather-advisory weather-advisory--${advisory.level}">
               <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
               <p>
                 ${advisory.text}
                 <a href="https://www.panahon.gov.ph/" target="_blank" rel="noopener noreferrer">
                   Check PAGASA for official advisories</a>.
               </p>
             </div>`
          : '';

        // The container is a plain div and the disclosure is a real <button>.
        // The previous markup put role="button" on a wrapper that contained
        // links and buttons, which axe flags as nested-interactive and which
        // gives screen-reader users an unusable control.
        container.innerHTML = `
          <div class="premium-weather-widget" data-scene="${data.scene || 'cloudy'}" data-daypart="${data.isDay ? 'day' : 'night'}">
              <div class="weather-scene" aria-hidden="true">
                <span class="weather-scene-orb"></span>
                <span class="weather-scene-cloud weather-scene-cloud--a"></span>
                <span class="weather-scene-cloud weather-scene-cloud--b"></span>
                <span class="weather-scene-rain"></span>
              </div>

              <div class="weather-header">
                  <div class="weather-current-icon" aria-hidden="true" style="color: ${data.color || 'var(--color-primary)'}">
                      <i class="bi ${data.icon}"></i>
                  </div>
                  <div class="weather-current-info">
                      <div class="weather-current-temp">${data.temperature}&deg;C</div>
                      <div class="weather-current-condition">${data.condition}</div>
                  </div>
                  <button
                    type="button"
                    class="weather-expand-indicator"
                    id="weather-disclosure"
                    aria-expanded="false"
                    aria-controls="weather-expanded-content"
                  >
                    <i class="bi bi-chevron-down indicator-icon" aria-hidden="true"></i>
                    <span class="sr-only">Show detailed weather for Legazpi City</span>
                  </button>
              </div>

              ${advisoryHTML}
              ${rainHTML}

              <div class="weather-days" aria-label="Five day outlook">
                  ${dailyHTML}
              </div>

              <div class="weather-desktop-visible">
                  <div class="weather-ai-summary">
                    <div class="ai-summary-icon">
                       <i class="bi bi-stars" aria-hidden="true"></i>
                    </div>
                    <div class="ai-summary-text">
                      <p>${insights.summary}</p>
                    </div>
                  </div>
              </div>

              <div class="weather-expanded-content" id="weather-expanded-content">
                  <div class="weather-actions-grid">
                      ${actionsHTML}
                  </div>

                  <div class="weather-hourly-container">
                      <h4 class="weather-hourly-title">Next 5 Hours</h4>
                      <div class="weather-hourly-scroll">
                          ${hourlyHTML}
                      </div>
                  </div>
              </div>

              <div class="weather-desktop-visible">
                  <div class="weather-footer">
                    <a href="https://www.panahon.gov.ph/" target="_blank" rel="noopener noreferrer">Official PAGASA Updates <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>
                  </div>
              </div>
          </div>
        `;

        const widget = container.querySelector('.premium-weather-widget');
        const toggle = container.querySelector('#weather-disclosure');
        if (widget && toggle) {
          toggle.addEventListener('click', function () {
            const expanded = widget.classList.toggle('is-expanded');
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
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
