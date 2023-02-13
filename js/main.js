// apis base urls.
const userDateApi = 'http://api.aladhan.com/v1/currentDate?zone=';
const userTimeApi = 'http://api.aladhan.com/v1/currentTime?zone=';
const userLocationApi = 'https://geolocation-db.com/json/';

// months array.
const monthArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// user date.
const userDate = new Date();
const userDay = userDate.getDate();
const userMonth = userDate.getMonth();
const userYear = userDate.getFullYear();

// the starting point of the application:
// 1. get the user location by ip.
// 2. get prayers based on the user location.
// 3. get the date and time based on the timezone returned by the prayers api.
// 4. get the time untill next prayer.
getUserLocation().then(res => {
    const getPrayersInputs = {
        city: res.city || 'Cairo',
        country: res.country_name || 'EG',
        month: userMonth,
        year: userYear
    }
    getPrayers(getPrayersInputs);
}).catch(e => {
    console.log(e.message);
});

// get user input.
const userInput = document.querySelector('.info input');

// when the user clicks enter.
userInput.addEventListener('keypress', (e) => {
    if (e.key == 'Enter') {
        getPrayersFromUserInput(userInput.value);
    }
});

// when the user clicks the magnifying icon.
document.querySelector('.search i').addEventListener('click', () => {
    getPrayersFromUserInput(userInput.value);
});

// get user location via his ip address.
async function getUserLocation() {
    // run loader
    document.querySelector('.lds-ring').classList.add('active');

    const response = await fetch(userLocationApi);
    const data = await response.json();

    // set the city and country from the location returned by the ip address.
    document.querySelector('.info .location .city').innerHTML = data.city || 'Cairo';
    document.querySelector('.info .location .country').innerHTML = data.country_code || 'EG';

    // remove loader
    document.querySelector('.lds-ring').classList.remove('active');

    return Promise.resolve(data);
}

// get country name from city name.
async function getCountryName(city) {
    try {
        const countryNameApi = `https://api.openweathermap.org/data/2.5/weather?q=${city.trim()}&APPID=20f7632ffc2c022654e4093c6947b4f4`;
        const response = await fetch(countryNameApi);
        const data = await response.json();

        // get country name from country code.
        let regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        let countryName = regionNames.of(data.sys.country);

        // set the city and country from the location inputed by the user.
        document.querySelector('.info .location .city').innerHTML = data.name;
        document.querySelector('.info .location .country').innerHTML = data.sys.country;

        return Promise.resolve({ city: data.name, country: countryName });

    } catch (error) {
        console.log(error.message);
    }
}

// get date and time based on timezone returned from prayers api.
async function getUserDateTime({ timezone }) {

    const timeResponse = await fetch(`${userTimeApi}${timezone}`);
    const timeData = await timeResponse.json();
    const dateResponse = await fetch(`${userDateApi}${timezone}`);
    const dateData = await dateResponse.json();

    // slice the date and time responses to manipulate the way they are represented.
    const hour = timeData.data.slice(0, 2);
    const minute = timeData.data.slice(3, 5);
    const day = dateData.data.slice(0, 2);
    const month = parseInt(dateData.data.slice(3, 5));
    const year = dateData.data.slice(6);

    // set date and time based on the timezone.
    document.querySelector('.info .date-time .date').innerHTML = `${day} ${monthArr[month - 1]} ${year}`;
    document.querySelector('.info .date-time .time').innerHTML = `${parseInt(hour) > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;

    return Promise.resolve({ date: dateData.data, time: timeData.data });
}

// get prayers via city, country, month and year.
async function getPrayers({ city, country, month, year }) {
    // run loader
    document.querySelector('.lds-ring').classList.add('active');

    const userPrayersApi = `http://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=5&month=${month < 10 ? `0${month + 1}` : month + 1}&year=${year}`;
    const response = await fetch(userPrayersApi);
    const data = await response.json();

    // deep clone the data object to generate a new way to represent prayers time data as 12 hours systen.
    const timings = JSON.parse(JSON.stringify(data.data[userDay - 1].timings));

    // loop over the prayers time data to appropriately represent them.
    for (let time in timings) {

        // remove the (EET) string from the times.
        timings[time] = timings[time].slice(0, 5);

        const hours = parseInt(timings[time].slice(0, 2));
        const minutes = timings[time].slice(3, 5);

        // put 0 before the hours and minutes that are less than 10.
        // put am and pm.
        if (hours >= 12) {
            if (hours > 12) {
                timings[time] = `${hours - 12 < 10 ? `0${hours - 12}` : hours - 12}:${minutes} PM`;
            } else {
                timings[time] = `${hours < 10 ? `0${hours}` : hours}:${minutes} PM`;
            }
        } else {
            timings[time] = `${hours < 10 ? `0${hours}` : hours}:${minutes} AM`;
        }
    }

    // get the divs in which we will represent the prayers times.
    const prayersTime = document.querySelectorAll('.prayers .prayer .prayer-time');

    // put prayers times in the UI.
    prayersTime[0].innerHTML = timings.Fajr;
    prayersTime[1].innerHTML = timings.Sunrise;
    prayersTime[2].innerHTML = timings.Dhuhr;
    prayersTime[3].innerHTML = timings.Asr;
    prayersTime[4].innerHTML = timings.Maghrib;
    prayersTime[5].innerHTML = timings.Isha;

    // get the user date and time based on the timezone.
    getUserDateTime({ timezone: data.data[0].meta.timezone }).then(res => {

        // get the timings of the prayers for today.
        const timings = data.data[userDay - 1].timings;

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

        // calculate the next payer based on the time we are in now and the today's prayers times.
        getNextPrayer(getNextPrayerInputs);
    });

    // remove loader
    document.querySelector('.lds-ring').classList.remove('active');
}

// get next prayer and the remaining time untill it.
function getNextPrayer({ time, date, prayers }) {

    // rearrange the the date to put it inside new Date() object.
    date = `${date.slice(6)}-${date.slice(3, 5)}-${date.slice(0, 2)}`

    // get the timings of the prayers in chronological order.
    const prayersArray = [prayers.fajr, prayers.sunrise, prayers.dhuhr, prayers.asr, prayers.maghrib, prayers.isha];

    // loop over the arranged array of the prayers and return only the prayers that will be next.
    const nextPrayersArray = prayersArray.filter((ele) => {
        return (new Date(`${date} ${time}`)) <= (new Date(`${date} ${ele}`));
    });

    // remove active from all the prayers to put it in a specific prayer which will be the next one.
    document.querySelectorAll('.prayers .prayer').forEach(ele => {
        ele.classList.remove('active');
    });

    // check if the nextPrayersArray contains one or more than one prayer.
    // if nextPrayersArray is empty that means today's prayers are end and we should present tomorrow's fajr.
    if (nextPrayersArray.length >= 1) {

        // get the index of next prayer which is the first element in the nextPrayersArray.
        const nextPrayerIdx = prayersArray.indexOf(nextPrayersArray.shift());

        // give the next prayer class active to be different than the other prayers.
        document.querySelectorAll('.prayers .prayer')[nextPrayerIdx].classList.add('active');

        // set the name of the next prayer from the prayers section.
        // the prayers section present prayers in chronological order.
        /* the index of the prayer of the prayersArray is the same as 
           the index of the prayer of the collection returned from selecting all the prayers.*/
        document.querySelector('.info .next-prayer-time span').innerHTML = document.querySelectorAll('.prayers .prayer .prayer-name')[nextPrayerIdx].innerHTML;

        // dedducting the time of the present moment from the time of the next prayer array to calc the remaining time till next prayer.
        const remainingTime = (new Date(`${date} ${prayersArray[nextPrayerIdx]}`)) - (new Date(`${date} ${time}`));

        // get the remaining houres and minites till the next prayer.
        const hours = Math.floor(remainingTime / 1000 / 60 / 60);
        const minutes = (remainingTime / 1000 / 60) - (hours * 60);

        // set the remaining houres and minites till the next prayer.
        document.querySelector('.info .next-prayer-time time').innerHTML = `${hours < 10 ? `0${hours}` : hours} : ${minutes < 10 ? `0${minutes}` : minutes}`;

        // if the pryaers of the current day ends, we will calc the time till next fajr which will be tomorrow.
    } else if ((new Date(`${date} ${time}`)) < (new Date(`${date} 23:59`)) && nextPrayersArray.length == 0) {

        //  add active class to the fajr prayer of the next day.
        document.querySelector('.prayers .prayer').classList.add('active');

        // add one day to the date of today to calculate the remaining time till next fajr of tomorrow.
        let oldDay = date.slice(8);
        let newDay = +oldDay + 1;
        // newDay is tomorrow.
        newDay = newDay < 10 ? `0${newDay}` : `${newDay}`;

        // add one day to the fajr time to calculate the remaining time between now and the fajr of the next day.
        const remainingTime = (new Date(`${`${date.slice(0, 4)}-${date.slice(5, 7)}-${newDay}`} ${prayersArray[0]}`)) - (new Date(`${date} ${time}`));

        // get the hours and minutes till the next fajr of the next day.
        const hours = Math.floor(remainingTime / 1000 / 60 / 60);
        const minutes = (remainingTime / 1000 / 60) - (hours * 60);

        // set the remaining time of the fajr of the next day.
        document.querySelector('.info .next-prayer-time time').innerHTML = `${hours < 10 ? `0${hours}` : hours} : ${minutes < 10 ? `0${minutes}` : minutes}`;

        // set the name of the next prayer which is the fajr of the next day so i put it statically.
        document.querySelector('.info .next-prayer-time span').innerHTML = 'Fajr';
    }

}

// get prayers of specific city from the user input.
function getPrayersFromUserInput(input) {
    // prevent the user from making http requests for empty string.
    if (input == '') return;

    getCountryName(input).then(res => {
        const getPrayersInputs = {
            city: res.city,
            country: res.country,
            month: userMonth,
            year: userYear
        }
        getPrayers(getPrayersInputs);
    });

    // empty the search box.
    userInput.value = '';
}