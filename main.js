const userLocationApi = 'http://ip-api.com/json/';
// const userDateApi = 'http://api.aladhan.com/v1/currentDate?zone=';
// const userTimeApi = 'http://api.aladhan.com/v1/currentTime?zone=';
const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];

async function getUserLocation() {
    const response = await axios.get(userLocationApi);
    return Promise.resolve(response.data);
}

async function getUserDateTime() {
    // const dateResponse = await axios.get(`${userDateApi}${timezone}`);
    // const timeResponse = await axios.get(`${userTimeApi}${timezone}`);



    // const dateArr = dateResponse.data.data.split('-');
    // const reversedDate = `${dateArr[1]}-${dateArr[0]}-${dateArr[2]}`;
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours()
    const minutes = date.getMinutes()

    return Promise.resolve({time: {hours, minutes}, month, year, day});
}

async function getPrayers({city, country, month, year, day}) {
    const userPrayersApi = `http://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=5&month=${month < 10 ? `0${month}`: month}&year=${year}`;
    const response = await axios.get(userPrayersApi);
    console.log(response.data.data[day - 1].timings);
    const timings = response.data.data[day - 1].timings;

    for (let time in timings) {
        console.log(timings[time]);
        timings[time] = timings[time].slice(0,5);

        const hours = parseInt(timings[time].slice(0,2));
        const minutes = parseInt(timings[time].slice(3,5));

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

}

getUserLocation().then(res => {

    document.querySelector('.info .location .city').innerHTML = res.city;
    document.querySelector('.info .location .country').innerHTML = res.countryCode;
    
    getUserDateTime().then((result) => {
        console.log(result.time.hours, result.time.minutes, result.day, result.month, result.year);

        document.querySelector('.info .date-time .date').innerHTML = `${result.day} ${month[result.month - 1]} ${result.year}`;
        document.querySelector('.info .date-time .time').innerHTML = `${result.time.hours > 12 ? `0${result.time.hours - 12}` : result.time.hours}:${result.time.minutes} ${result.time.hours >= 12 ? 'PM' : 'AM'}`;

        getPrayers({city: res.city, country: res.country, month: result.month, year: result.year, day: result.day})

    })

}).catch(e => {
    console.log(e.message);
});