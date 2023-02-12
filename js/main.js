// const userDateApi = 'http://api.aladhan.com/v1/currentDate?zone=';
// const userTimeApi = 'http://api.aladhan.com/v1/currentTime?zone=';
const userLocationApi = 'http://ip-api.com/json/';
const monthArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let nextPrayer = undefined;

const input = document.querySelector('.info input');

async function getUserLocation() {
    const response = await axios.get(userLocationApi);

    document.querySelector('.info .location .city').innerHTML = response.data.regionName;
    document.querySelector('.info .location .country').innerHTML = response.data.countryCode;
    console.log(response.data);

    return Promise.resolve(response.data);
}

async function getUserDateTime({ city, country }) {
    // const dateResponse = await axios.get(`${userDateApi}${timezone}`);
    // const timeResponse = await axios.get(`${userTimeApi}${timezone}`);
    // const dateArr = dateResponse.data.data.split('-');
    // const reversedDate = `${dateArr[1]}-${dateArr[0]}-${dateArr[2]}`;
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();

    // console.log(result.time.hours, result.time.minutes, result.day, result.month, result.year);

    document.querySelector('.info .date-time .date').innerHTML = `${day} ${monthArr[month]} ${year}`;
    document.querySelector('.info .date-time .time').innerHTML = `${hour > 12 ? `0${hour - 12}` : hour}:${minute < 10 ? `0${minute}` : minute} ${hour >= 12 ? 'PM' : 'AM'}`;

    getPrayers({ city, country, month, year, day, hour, minute })
}

async function getPrayers({ city, country, month, year, day, hour, minute }) {
    const userPrayersApi = `http://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=5&month=${month < 10 ? `0${month + 1}` : month + 1}&year=${year}`;
    const response = await axios.get(userPrayersApi);
    console.log(month);
    console.log(response.data.data[day - 1].timings);
    const timings = response.data.data[day - 1].timings;

    for (let time in timings) {
        console.log(timings[time]);
        timings[time] = timings[time].slice(0, 5);

        const hours = parseInt(timings[time].slice(0, 2));
        const minutes = parseInt(timings[time].slice(3, 5));

        if (hours >= 12) {
            if (hours > 12) {
                timings[time] = `${hours - 12}:${minutes} PM`
            } else {
                timings[time] = `${hours}:${minutes} PM`
            }
        } else {
            timings[time] = `${hours}:${minutes} AM`
        }
    }

    const prayersTime = document.querySelectorAll('.prayers .prayer .prayer-time');

    prayersTime[0].innerHTML = timings.Fajr;
    prayersTime[1].innerHTML = timings.Sunrise;
    prayersTime[2].innerHTML = timings.Dhuhr;
    prayersTime[3].innerHTML = timings.Asr;
    prayersTime[4].innerHTML = timings.Maghrib;
    prayersTime[5].innerHTML = timings.Isha;

    prayersTime.forEach(ele => {
        ele.parentElement.classList.remove('active');
    })

}

async function searchForCities() {
    try {
        const countryNameApi = `https://api.openweathermap.org/data/2.5/weather?q=${input.value}&APPID=20f7632ffc2c022654e4093c6947b4f4`;
        const response = await axios.get(countryNameApi);

        // get country name from country code.
        let regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        let countryName = regionNames.of(response.data.sys.country);

        document.querySelector('.info .location .city').innerHTML = response.data.name;
        document.querySelector('.info .location .country').innerHTML = response.data.sys.country;

        getUserDateTime({ city: input.value, country: countryName });

        input.value = '';

    } catch (error) {
        console.log(error.message);
    }
}

getUserLocation().then(res => {

    getUserDateTime({ city: res.city, country: res.countryCode })

}).catch(e => {
    console.log(e.message);
});



input.addEventListener('keypress', (e) => {
    if (e.key == 'Enter') {
        searchForCities();
    }
});

document.querySelector('.search').addEventListener('click', () => {
    searchForCities();
})

