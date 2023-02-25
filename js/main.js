// apis base urls.
// const userDateApi = 'http://api.aladhan.com/v1/currentDate?zone=';
// const userTimeApi = 'http://api.aladhan.com/v1/currentTime?zone=';
const userLocationApi = 'https://geolocation-db.com/json/';

// months array.
const monthArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// current city name.
let currentCity = 'Cairo';
let currentCountry = 'EG';

// globak set interval id.
let intervalId = null;

// remaining time till next prayer.
let remaining = 0;
let remainingSeconds = 60;

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
appInit();

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

// when the user clicks the refresh btn.
document.querySelector('.next-prayer-time i').addEventListener('click', () => {
    getPrayersFromUserInput(currentCity);
});

// get user location via his ip address.
async function getUserLocation() {
    // run loader
    document.querySelector('.lds-ring').classList.add('active');

    try {
        const response = await fetch(userLocationApi);
        const data = await response.json();

        // set the city and country from the location returned by the ip address.
        document.querySelector('.info .location .city').innerHTML = data.city || 'Cairo';
        document.querySelector('.info .location .country').innerHTML = `,${data.country_code || 'EG'}`;

        currentCity = data.city || 'Cairo';

        return data;

    } catch (error) {
        console.log(new Error(error.message + " user location from ip address."));

        return { city: 'Cairo', country_name: 'Egypt' };
    }
}

// get country name from city name.
async function getCountryName(city) {
    // run loader
    document.querySelector('.lds-ring').classList.add('active');

    try {
        const countryNameApi = `https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=20f7632ffc2c022654e4093c6947b4f4`;
        const response = await fetch(countryNameApi);
        const data = await response.json();

        currentCity = data.name || 'Cairo';
        currentCountry = data.sys.country || 'Egypt';

        return { city: data.name, country: data.sys.country };

    } catch (error) {
        console.log(new Error(error));

        alert('Enter a valid city name.');

        // remove loader
        document.querySelector('.lds-ring').classList.remove('active');
    }
}

// get date and time based on timezone returned from prayers api.
async function getUserDateTime({ timezone }) {

    try {
        const apiKey = '71c6c5e231a94c6c9fd559f30a4be110';
        const timeResponse = await fetch(`https://api.ipgeolocation.io/timezone?apiKey=${apiKey}&tz=${timezone}`);
        const timeData = await timeResponse.json();

        // slice the date and time responses to manipulate the way they are represented.
        const hour = timeData.time_12.slice(0, 2);
        const minute = timeData.time_12.slice(3, 5);
        const amOrPm = timeData.time_12.slice(8);
        const day = timeData.date.slice(8);
        const month = timeData.month;
        const year = timeData.year;

        // set time based on the timezone.
        document.querySelector('.info .date-time .time').innerHTML = `${hour} : ${minute} ${amOrPm}`;

        // set date based on the timezone.
        document.querySelector('.info .date-time .date').innerHTML = ` ${day} ${monthArr[month - 1]} ${year}`;

        return {
            date: {
                day, year, month: timeData.date.slice(5, 7)
            }, time: `${timeData.time_24.slice(0, 2)}:${timeData.time_24.slice(3, 5)}`
        };
    } catch (error) {
        console.log(new Error(error.message));
    }
}

// get prayers via city, country, month and year.
async function getPrayers({ city, country }) {

    try {
        const userPrayersApi = `http://api.aladhan.com/v1/calendarByCity?city=${city || 'Cairo'}&country=${country || 'Egypt'}&method=5&month=${userMonth + 1}&year=${userYear}`;
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
                    timings[time] = `${hours}:${minutes} PM`;
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
        const res = await getUserDateTime({ timezone: data.data[0].meta.timezone });

        // get the timings of the prayers for today in 24 hours system.
        const timings24HSys = data.data[userDay - 1].timings;

        const getNextPrayerInputs = {
            time: res.time,
            date: res.date,
            prayers: {
                fajr: timings24HSys.Fajr.slice(0, 5),
                sunrise: timings24HSys.Sunrise.slice(0, 5),
                dhuhr: timings24HSys.Dhuhr.slice(0, 5),
                asr: timings24HSys.Asr.slice(0, 5),
                maghrib: timings24HSys.Maghrib.slice(0, 5),
                isha: timings24HSys.Isha.slice(0, 5)
            }
        }
        // calculate the next payer based on the time we are in now and the today's prayers times.
        getNextPrayer(getNextPrayerInputs);

        // remove loader
        document.querySelector('.lds-ring').classList.remove('active');
    } catch (error) {
        console.log(new Error(error.message));
    }
}

// get next prayer and the remaining time untill it.
function getNextPrayer({ time, date, prayers }) {

    // reset seconds
    remainingSeconds = 60;

    // rearrange the the date to put it inside new Date() object.
    date = `${date.year}-${date.month}-${date.day}`

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

        remaining = remainingTime - 60000;

        // set interval on the remaining time until the next prayer time.
        intervalId = setInterval(() => {

            // if the remaining time is 0 then get the next prayer.
            if (remaining == 0 && remainingSeconds <= 0) getPrayersFromUserInput(currentCity);

            // get the remaining houres and minites till the next prayer.
            let hours = Math.floor(remaining / 1000 / 60 / 60);
            let minutes = Math.ceil((remaining / 1000 / 60) - (hours * 60));

            remaining -= 1000;
            remainingSeconds--;
            if (remaining < 0) remaining = 0;
            if (remainingSeconds < 0) remainingSeconds = 59;

            // set the remaining houres and minites till the next prayer.
            document.querySelector('.info .next-prayer-time time').innerHTML = `${hours < 10 ? `0${hours}` : hours} : ${minutes < 10 ? `0${minutes}` : minutes} : ${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`;

        }, 1000);

        // if the pryaers of the current day ended, we will calc the time till next fajr which will be tomorrow.
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

        remaining = remainingTime - 60000;

        // set interval on the remaining time until the next fajr time.
        intervalId = setInterval(() => {

            // if the remaining time is 0 then get the next prayer.
            if (remaining == 0 && remainingSeconds == 0) getPrayersFromUserInput(currentCity);

            // get the remaining houres and minites till the next prayer.
            let hours = Math.floor(remaining / 1000 / 60 / 60);
            let minutes = Math.ceil((remaining / 1000 / 60) - (hours * 60));

            remaining -= 1000;
            remainingSeconds--;
            if (remaining < 0) remaining = 0;
            if (remainingSeconds < 0) remainingSeconds = 59;

            // set the remaining time of the fajr of the next day.
            document.querySelector('.info .next-prayer-time time').innerHTML = `${hours < 10 ? `0${hours}` : hours} : ${minutes < 10 ? `0${minutes}` : minutes} : ${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`;

        }, 1000);

        // set the name of the next prayer which is the fajr of the next day so i put it statically.
        document.querySelector('.info .next-prayer-time span').innerHTML = 'Fajr';
    }

}

// get prayers of specific city from the user input.
async function getPrayersFromUserInput(input) {
    try {
        // prevent the user from making http requests for empty string.
        if (input === '') return;

        const res = await getCountryName(input);

        const getPrayersInputs = {
            city: res.city,
            country: res.country
        }

        // clear the last set interval in order to make a new one.
        clearInterval(intervalId);

        // handle long cities names.
        document.querySelector('.info .location .city').classList.remove('long');
        document.querySelector('.info .date-time').classList.remove('city-long');
        if (res.city.length > 15) {
            document.querySelector('.info .location .city').classList.add('long');
            document.querySelector('.info .date-time').classList.add('city-long');
        }

        // set the city and country from the location inputed by the user.
        document.querySelector('.info .location .city').innerHTML = res.city;
        document.querySelector('.info .location .country').innerHTML = `,${res.country}`;

        getPrayers(getPrayersInputs);

    } catch (error) {
        console.log(new Error(error.message));
    } finally {
        // empty the search box.
        userInput.value = '';
    }
}

// the starting point of the application:
// 1. get the user location by ip.
// 2. get prayers based on the user location.
// 3. get the date and time based on the timezone returned by the prayers api.
// 4. get the time untill next prayer.
async function appInit() {
    const res = await getUserLocation();
    const getPrayersInputs = {
        city: res.city,
        country: res.country_name
    }
    getPrayers(getPrayersInputs);
}