const userDateApi = 'http://api.aladhan.com/v1/currentDate?zone=';
const userTimeApi = 'http://api.aladhan.com/v1/currentTime?zone=';
const userLocationApi = 'http://ip-api.com/json/';
const monthArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let nextPrayer = undefined;

const date = new Date();
const userDay = date.getDate();
const userMonth = date.getMonth();
const userYear = date.getFullYear();
// const hour = date.getHours();
// const minute = date.getMinutes();


async function getUserLocation() {
    const response = await axios.get(userLocationApi);

    document.querySelector('.info .location .city').innerHTML = response.data.regionName;
    document.querySelector('.info .location .country').innerHTML = response.data.countryCode;
    console.log(response.data);

    return Promise.resolve(response.data);
}

async function getCountryName(city) {
    try {
        const countryNameApi = `https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=20f7632ffc2c022654e4093c6947b4f4`;
        const response = await axios.get(countryNameApi);

        // get country name from country code.
        let regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        let countryName = regionNames.of(response.data.sys.country);

        document.querySelector('.info .location .city').innerHTML = response.data.name;
        document.querySelector('.info .location .country').innerHTML = response.data.sys.country;

        console.log({ city: response.data.name, country: countryName });

        return Promise.resolve({ city: response.data.name, country: countryName });

    } catch (error) {
        console.log(error.message);
    }
}

async function getUserDateTime({ timezone }) {
    const timeResponse = await axios.get(`${userTimeApi}${timezone}`);
    const dateResponse = await axios.get(`${userDateApi}${timezone}`);

    const hour = timeResponse.data.data.slice(0, 2);
    const minute = timeResponse.data.data.slice(3, 5);
    const day = dateResponse.data.data.slice(0, 2);
    const month = parseInt(dateResponse.data.data.slice(3, 5));
    const year = dateResponse.data.data.slice(6);

    document.querySelector('.info .date-time .date').innerHTML = `${day} ${monthArr[month]} ${year}`;
    document.querySelector('.info .date-time .time').innerHTML = `${parseInt(hour) > 12 ? `0${hour - 12}` : hour}:${minute < 10 ? `0${minute}` : minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

async function getPrayers({ city, country, month, year }) {
    const userPrayersApi = `http://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=5&month=${month < 10 ? `0${month + 1}` : month + 1}&year=${year}`;
    const response = await axios.get(userPrayersApi);

    const timings = response.data.data[userDay - 1].timings;

    for (let time in timings) {
        console.log(timings[time]);
        timings[time] = timings[time].slice(0, 5);

        const hours = parseInt(timings[time].slice(0, 2));
        const minutes = parseInt(timings[time].slice(3, 5));

        if (hours >= 12) {
            if (hours > 12) {
                timings[time] = `${hours - 12 < 10 ? `0${hours - 12}` : hours - 12}:${minutes < 10 ? `0${minutes}` : minutes} PM`
            } else {
                timings[time] = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes} PM`
            }
        } else {
            timings[time] = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes} AM`
        }
    }

    const prayersTime = document.querySelectorAll('.prayers .prayer .prayer-time');

    prayersTime[0].innerHTML = timings.Fajr;
    prayersTime[1].innerHTML = timings.Sunrise;
    prayersTime[2].innerHTML = timings.Dhuhr;
    prayersTime[3].innerHTML = timings.Asr;
    prayersTime[4].innerHTML = timings.Maghrib;
    prayersTime[5].innerHTML = timings.Isha;

    getUserDateTime({ timezone: response.data.data[0].meta.timezone })
}

function getPrayersFromUserInput(input) {
    getCountryName(input).then(res => {
        getPrayers({ city: res.city, country: res.countryCode, month: userMonth, year: userYear })
        input = '';
    })
}


getUserLocation().then(res => {
    getPrayers({ city: res.city, country: res.countryCode, month: userMonth, year: userYear })
}).catch(e => {
    console.log(e.message);
});


const input = document.querySelector('.info input');

input.addEventListener('keypress', (e) => {
    if (e.key == 'Enter') {
        getPrayersFromUserInput(input.value);
    }
});

document.querySelector('.search').addEventListener('click', () => {
    getPrayersFromUserInput(input.value);
})

// console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
