const userDateApi = 'http://api.aladhan.com/v1/currentDate?zone=';
const userTimeApi = 'http://api.aladhan.com/v1/currentTime?zone=';
const userLocationApi = 'http://ip-api.com/json/';
const monthArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const userDate = new Date();
const userDay = userDate.getDate();
const userMonth = userDate.getMonth();
const userYear = userDate.getFullYear();


async function getUserLocation() {
    const response = await axios.get(userLocationApi);

    document.querySelector('.info .location .city').innerHTML = response.data.city;
    document.querySelector('.info .location .country').innerHTML = response.data.countryCode;

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

    document.querySelector('.info .date-time .date').innerHTML = `${day} ${monthArr[month - 1]} ${year}`;
    document.querySelector('.info .date-time .time').innerHTML = `${parseInt(hour) > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;

    return Promise.resolve({ date: dateResponse.data.data, time: timeResponse.data.data })
}

async function getPrayers({ city, country, month, year }) {
    const userPrayersApi = `http://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=5&month=${month < 10 ? `0${month + 1}` : month + 1}&year=${year}`;
    const response = await axios.get(userPrayersApi);

    const timings = response.data.data[userDay - 1].timings;

    for (let time in timings) {
        timings[time] = timings[time].slice(0, 5);

        const hours = parseInt(timings[time].slice(0, 2));
        const minutes = timings[time].slice(3, 5);

        if (hours >= 12) {
            if (hours > 12) {
                timings[time] = `${hours - 12 < 10 ? `0${hours - 12}` : hours - 12}:${minutes} PM`
            } else {
                timings[time] = `${hours < 10 ? `0${hours}` : hours}:${minutes} PM`
            }
        } else {
            timings[time] = `${hours < 10 ? `0${hours}` : hours}:${minutes} AM`
        }
    }

    const prayersTime = document.querySelectorAll('.prayers .prayer .prayer-time');

    prayersTime[0].innerHTML = timings.Fajr;
    prayersTime[1].innerHTML = timings.Sunrise;
    prayersTime[2].innerHTML = timings.Dhuhr;
    prayersTime[3].innerHTML = timings.Asr;
    prayersTime[4].innerHTML = timings.Maghrib;
    prayersTime[5].innerHTML = timings.Isha;

    getUserDateTime({ timezone: response.data.data[0].meta.timezone }).then(res => {

        const getNextPrayerInputs =
        {
            time: res.time,
            date: res.date,
            prayers: {
                fajr: timings.Fajr.slice(0, 5),
                sunrise: timings.Sunrise.slice(0, 5),
                dhuhr: timings.Dhuhr.slice(0, 5),
                asr: timings.Asr.slice(0, 5),
                maghrib: timings.Maghrib.slice(0, 5),
                isha: timings.Isha.slice(0, 5)
            }
        }
        getNextPrayer(getNextPrayerInputs);
    })
}

function getNextPrayer({ time, date, prayers }) {
    date = `${date.slice(6)}-${date.slice(3, 5)}-${date.slice(0, 2)}`

    const prayersArray = [prayers.fajr, prayers.sunrise, prayers.dhuhr, prayers.asr, prayers.maghrib, prayers.isha];

    const nextPrayersArray = prayersArray.filter((ele) => {
        return (new Date(`${date} ${time}`)) <= (new Date(`${date} ${ele}`));
    })

    document.querySelectorAll('.prayers .prayer').forEach(ele => {
        ele.classList.remove('active');
    })

    if (nextPrayersArray.length >= 1) {
        const nextPrayerIdx = prayersArray.indexOf(nextPrayersArray.shift())
        document.querySelectorAll('.prayers .prayer')[nextPrayerIdx].classList.add('active');
        document.querySelector('.info .next-prayer-time span').innerHTML = document.querySelectorAll('.prayers .prayer .prayer-name')[nextPrayerIdx].innerHTML;

        const remainingTime = (new Date(`${date} ${prayersArray[nextPrayerIdx]}`)) - (new Date(`${date} ${time}`));

        const hours = Math.floor(remainingTime / 1000 / 60 / 60);
        const minutes = (remainingTime / 1000 / 60) - (hours * 60);

        document.querySelector('.info .next-prayer-time time').innerHTML = `${hours < 10 ? `0${hours}` : hours} : ${minutes < 10 ? `0${minutes}` : minutes}`;

    } else {
        document.querySelector('.prayers .prayer').classList.add('active');
    }

}

function getPrayersFromUserInput(input) {
    getCountryName(input).then(res => {
        const getPrayersInputs = {
            city: res.city,
            country: res.country,
            month: userMonth,
            year: userYear
        }
        getPrayers(getPrayersInputs)
    })
}

getUserLocation().then(res => {
    const getPrayersInputs = {
        city: res.city,
        country: res.country,
        month: userMonth,
        year: userYear
    }
    getPrayers(getPrayersInputs)
}).catch(e => {
    console.log(e.message);
});


const input = document.querySelector('.info input');

input.addEventListener('keypress', (e) => {
    if (e.key == 'Enter') {
        getPrayersFromUserInput(input.value);
        input.value = '';
    }
});

document.querySelector('.search i').addEventListener('click', () => {
    getPrayersFromUserInput(input.value);
    input.value = '';
});

// console.log(nextPrayersArray);
// const cityTime = new Date(`${date} ${time}`);
// const fajr = new Date(`${date} ${prayers.fajr}`)
// const sunrise = new Date(`${date} ${prayers.sunrise}`)
// const dhuhr = new Date(`${date} ${prayers.dhuhr}`)
// const asr = new Date(`${date} ${prayers.asr}`)
// const maghrib = new Date(`${date} ${prayers.maghrib}`)
// const isha = new Date(`${date} ${prayers.isha}`)

// console.log(cityTime.getTime() >= fajr.getTime());
// console.log(cityTime.getTime() >= sunrise.getTime());
// console.log(cityTime.getTime() >= dhuhr.getTime());
// console.log(cityTime.getTime() >= asr.getTime());
// console.log(cityTime.getTime() >= maghrib.getTime());
// console.log(cityTime.getTime() >= isha.getTime());