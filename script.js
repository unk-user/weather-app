class WeatherService {
    constructor() {
        this.apiKey = "2a9c3825c4e14169a7c141107240402";
    }

    async fetchWeather(city) {
        try {
            const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${city}&days=5`;

            const response = await fetch(apiUrl, {
                mode: 'cors'
            });
            const data = await response.json();

            return data;
           
        } catch(error) {
            console.log(error);
        }
    }

    processCurrentWeather(weatherData) {
        const country = weatherData.location.country;
        const time = weatherData.location.localtime;
        const city = weatherData.location.name;

        const condition = weatherData.current.condition.text;
        const conditionCode = weatherData.current.condition.code;
        const icon = weatherData.current.condition.icon;

        const temperatureCelsius = weatherData.current.temp_c;
        const windDirection = weatherData.current.wind_dir;
        const windVelocity = weatherData.current.wind_kph;

        return {
            country, time, city, condition, conditionCode, icon, temperatureCelsius, windDirection, windVelocity
        }
    }
    processForecast(weatherData) {
        const forecastDays = [];

        weatherData.forecast.forecastday.slice(1).forEach((day) => {
            const date = day.date;
            const minTemp = day.day.mintemp_c;
            const maxTemp = day.day.maxtemp_c;
            const icon = day.day.condition.icon;
            const condition = day.day.condition.text;

            forecastDays.push({date, minTemp, maxTemp, icon, condition});
        })

        return forecastDays;
    }
    processTodayForecast(weatherData) {
        const hoursWeather = [];

        weatherData.forecast.forecastday[0].hour.forEach((hour) => {
            let time = hour.time;
            let temp = hour.temp_c;
            let icon = hour.condition.icon;

            hoursWeather.push({time, temp, icon});
        })

        return hoursWeather;
    }

    async fetchProcessedWeather(city) {
        const weatherData = await this.fetchWeather(city);

        const currentWeather = this.processCurrentWeather(weatherData);
        const todaysForecast = this.processTodayForecast(weatherData);
        const forecast = this.processForecast(weatherData);4

        return {currentWeather, todaysForecast, forecast};
    }

}

let weatherService = new WeatherService();

//UI 

const locationSearch = document.querySelector('#location');
const currentTemp = document.querySelector('#current-temp');
const windVel = document.querySelector('#wind-velocity');
const forecastDaysContainer = document.querySelector('#forecast-days');
const condition = document.querySelector('#condition');
const todaysDate = document.querySelector('#date');
const currentTime = document.querySelector('#time');
const forecastToday = document.querySelector('#forecast-today');
const body = document.querySelector('body');
const mainOverlay = document.querySelector('#mainOverlay');

function expandDirection(abbreviation) {
    const directionMap = {
      'N': 'North',
      'NNE': 'North-Northeast',
      'NE': 'Northeast',
      'ENE': 'East-Northeast',
      'E': 'East',
      'ESE': 'East-Southeast',
      'SE': 'Southeast',
      'SSE': 'South-Southeast',
      'S': 'South',
      'SSW': 'South-Southwest',
      'SW': 'Southwest',
      'WSW': 'West-Southwest',
      'W': 'West',
      'WNW': 'West-Northwest',
      'NW': 'Northwest',
      'NNW': 'North-Northwest'
    };
  
    return directionMap[abbreviation.toUpperCase()];
  }

 
const loadCurrentWeather = (currentWeather) => {
    currentTemp.textContent = `${currentWeather.temperatureCelsius}°C`;
    windVel.textContent = `${expandDirection(currentWeather.windDirection)}, ${currentWeather.windVelocity}KM/h`;
    condition.textContent = currentWeather.condition;

    const [date, time] = currentWeather.time.split(' ');
    todaysDate.textContent = date;
    currentTime.textContent= time;

    locationSearch.setAttribute('placeholder', `${currentWeather.city}, ${currentWeather.country}`);
} 

const loadForecastDays = (forecast) => {
    forecastDaysContainer.innerHTML = '';
    forecast.forEach((day) => {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'forecast-day';

        const iconConttainer = document.createElement('img');
        iconConttainer.className = 'forecastDay-icon'
        iconConttainer.src = day.icon;
        
        const dateCondition = document.createElement('div');
        dateCondition.className = 'forecast-datecondition';
        const date = document.createElement('div');
        date.className = 'forecast-date';
        date.textContent = `${day.date}`;
        const condition = document.createElement('div');
        condition.className = 'forecast-condition';
        condition.textContent = day.condition

        const temperature = document.createElement('div');
        temperature.className = 'forecast-temp';
        const minTemperature = document.createElement('div');
        const maxTemperature = document.createElement('div');
        minTemperature.className = 'forecast-min';
        maxTemperature.className = 'forecast-max';
        minTemperature.textContent = `${day.minTemp}°`;
        maxTemperature.textContent = `${day.maxTemp}°`;

        temperature.appendChild(maxTemperature);
        temperature.appendChild(minTemperature);

        dateCondition.appendChild(date);
        dateCondition.appendChild(condition);

        dayContainer.appendChild(iconConttainer);
        dayContainer.appendChild(dateCondition);
        dayContainer.appendChild(temperature);

        forecastDaysContainer.appendChild(dayContainer);
    })
}

const loadForecastHours = (todaysForecast) => {
    forecastToday.innerHTML = '';
    todaysForecast.forEach((hour) => {
        const hourContainer = document.createElement('div');
        hourContainer.setAttribute('draggable', 'false');
        hourContainer.className = 'hourContainer';
    
        const [, time] = hour.time.split(' ');

        const hourTime = document.createElement('p');
        hourTime.className = 'forecast-hour';
        hourTime.textContent = `${time}`;
        
        const hourForecastIcon = document.createElement('img');
        hourForecastIcon.className = 'hourConditionIcon';
        hourForecastIcon.src = hour.icon;
        hourForecastIcon.setAttribute('draggable', 'false');

        const hourTemp = document.createElement('p');
        hourTemp.className = 'hourTemp';
        hourTemp.textContent = `${hour.temp}°C`;

        hourContainer.appendChild(hourTime);
        hourContainer.appendChild(hourForecastIcon);
        hourContainer.appendChild(hourTemp); 

        forecastToday.appendChild(hourContainer);
    })
}

const loadWeatherElements = async (city) => {
    const processedWeatherData = await weatherService.fetchProcessedWeather(city);

    const conditionCode = processedWeatherData.currentWeather.conditionCode;


    body.style.background = `Url(assets/${classifyWeather(conditionCode)}.jpg) no-repeat fixed center`;
    mainOverlay.style.background = `Url(assets/${classifyWeather(conditionCode)}.jpg) no-repeat fixed center / 100%`;

    loadCurrentWeather(processedWeatherData.currentWeather);
    loadForecastDays(processedWeatherData.forecast);
    loadForecastHours(processedWeatherData.todaysForecast);
}

window.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && locationSearch.value !== ''){
        loadWeatherElements(locationSearch.value);
        locationSearch.value = '';
        forecastToday.style.transform = `translateX(0)`;
    }

})

loadWeatherElements('morocco');

let track = document.querySelector('#track-container');

track.onmousedown = e => {
    track.dataset.mouseDownAt = e.clientX;
    track.dataset.prevPercentage = track.dataset.prevPercentage || "0"; 
}

track.onmouseup = () => {
    track.dataset.mouseDownAt = "0";
    track.dataset.prevPercentage = track.dataset.percentage;
}

track.onmousemove = e => {
    if(track.dataset.mouseDownAt === "0") return;

    let mouseDelta = e.clientX - parseFloat(track.dataset.mouseDownAt)  ,
        maxDelta = track.clientWidth; 

    let percentage = (mouseDelta / maxDelta) * -100,
        nextPercentage = parseFloat(track.dataset.prevPercentage) + percentage;
        nextPercentage = Math.max(0, Math.min(nextPercentage, 70));

    track.dataset.percentage = nextPercentage;

    forecastToday.style.transform = `translateX(-${nextPercentage}%)`;
}

function classifyWeather(conditionCode) {
    const weatherGroups = {
        '1000': 'Clear',
        '1003': 'Cloudy',
        '1006': 'Cloudy',
        '1009': 'Cloudy',
        '1030': 'Mist',
        '1063': 'Rain',
        '1066': 'Snow',
        '1069': 'Sleet',
        '1072': 'Sleet',
        '1087': 'Thunderstorms',
        '1114': 'neutral',
        '1117': 'neutral',
        '1135': 'Mist',
        '1147': 'neutral',
        '1150': 'Rain',
        '1153': 'Rain',
        '1168': 'Sleet',
        '1171': 'Sleet',
        '1180': 'Rain',
        '1183': 'Rain',
        '1186': 'Rain',
        '1189': 'Rain',
        '1192': 'Rain',
        '1195': 'Rain',
        '1198': 'Sleet',
        '1201': 'Sleet',
        '1204': 'Sleet',
        '1207': 'Sleet',
        '1210': 'Snow',
        '1213': 'Snow',
        '1216': 'Snow',
        '1219': 'Snow',
        '1222': 'Snow',
        '1225': 'Snow',
        '1237': 'neutral',
        '1240': 'neutral',
        '1243': 'neutral',
        '1246': 'neutral',
        '1249': 'neutral',
        '1252': 'neutral',
        '1255': 'neutral',
        '1258': 'neutral',
        '1261': 'neutral',
        '1264': 'neutral',
        '1273': 'Thunderstorms',
        '1276': 'Thunderstorms',
        '1279': 'Thunderstorms',
        '1282': 'Thunderstorms',
      };

      return weatherGroups[conditionCode];
}




