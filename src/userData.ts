import { ITheme, IUserTheme, ThemeNamesEnum, UserData } from "./types"

import { subMonths, getYear, getMonth, startOfToday, getDate } from 'date-fns'
import { db } from "./index"

const defaultTheme: IUserTheme =   {
  colorBlendPercent: 0.14,
  customTheme: null,
  isDarkMode: false,
  themeName: 'INDIGO' as ThemeNamesEnum,
}

const makeDefaultUser = (currentYearMonth:string): UserData=> ({
  name:'',
  checkedDays:{
    [currentYearMonth]: []
  },
  isStreaking: false,
  currentStreak: 0,
  longestStreak: 0,
  totalDays: 0,
  theme: defaultTheme
})

export async function getUser(uid: string) {
    const msInADay = 60* 60* 24* 1000; // 86400000
    const timezoneOffset =  new Date().getTimezoneOffset()
    const today = startOfToday().getTime() - (timezoneOffset * 60 * 1000);
    // TODO refactor / remove msInADay
    
    const yesterday = today - msInADay;
    const currentYearMonth = `${getYear(today)}${getMonth(today)}`

    const userFromMongo = await db.collection('Users').findOneAndUpdate(
      {uid},
      {$setOnInsert: {uid, body:makeDefaultUser(currentYearMonth)}},
      {upsert: true, returnDocument:'after'}
    )

    // TODO: error handling...
    const user:UserData = userFromMongo.value.body
    
    // all of this is only calculated on `getUser` which is only called on log in and page load, needs to be moved elsewhere..
    
    // default daysInConsecutiveMonths to values in the current {checkedDays[rearMonth]} or to an empty array
    let daysInConsecutiveMonths = user.checkedDays[currentYearMonth] || [];
    let consecutiveMonthIndex = 1;
    let yearMonth = `${getYear(subMonths(today, consecutiveMonthIndex))}${getMonth(subMonths(today, consecutiveMonthIndex))}`;
    
    while(user.checkedDays[yearMonth]) {
      const checkedDaysInMonth = user.checkedDays[yearMonth]
      daysInConsecutiveMonths = daysInConsecutiveMonths.concat(checkedDaysInMonth)
      consecutiveMonthIndex++;
      yearMonth = `${getYear(subMonths(today, consecutiveMonthIndex))}${getMonth(subMonths(today, consecutiveMonthIndex))}`;
    }

    let currentStreak = daysInConsecutiveMonths.includes(today) ? 1 : 0;
    if (daysInConsecutiveMonths && daysInConsecutiveMonths.includes(yesterday)) {
      // confirm that {yesterday - 1} is actually checked
      let i  = 1;
      let date = yesterday;
      while (daysInConsecutiveMonths.includes(date)) {
        const year = getYear(date)
        const month = getMonth(date)
        const dateNumber = getDate(date)
        currentStreak += 1;
        date = new Date(year, month, dateNumber).getTime() - (timezoneOffset * 60 * 1000)
        i++
      }
    }

    const allCheckedDays = user?.checkedDays
    && Object.values(user.checkedDays).reduce((prev, curr) => [...prev].concat(curr), []);

    if(!allCheckedDays.includes(yesterday)) {
      user.currentStreak = 0
    }
    console.log('currentStreak', user.currentStreak, 'longestStreak', user.longestStreak, 'new curr', currentStreak, )
    if(currentStreak > user.longestStreak) user.longestStreak = currentStreak;
    user.currentStreak = currentStreak;
    user.totalDays = allCheckedDays.length;
    return user;
}

export async function updateUser (user:UserData, uid:string) {
  const userFromMongo = await db.collection('Users').findOneAndUpdate({uid}, {$set: {body: user}}, {returnDocument: 'after'})
  const updatedUser:UserData = userFromMongo.value.body

  return updatedUser
}