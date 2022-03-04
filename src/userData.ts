import { ITheme, IUserTheme, ThemeNamesEnum, UserData } from "./types"

import { subMonths, getYear, getMonth, startOfToday, getDate, startOfYesterday } from 'date-fns'
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
    const timezoneOffset =  new Date().getTimezoneOffset()
    const today = startOfToday().getTime() - (timezoneOffset * 60 * 1000);
    const yesterday = startOfYesterday().getTime() - (timezoneOffset * 60 * 1000);
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

      let date = yesterday;
      while (daysInConsecutiveMonths.includes(date)) {
        const year = getYear(date - 1)
        const month = getMonth(date - 1)
        const dateNumber = getDate(date - 1)
        currentStreak += 1;
        date = new Date(year, month, dateNumber).getTime() - (timezoneOffset * 60 * 1000)
      }
    }

    const allCheckedDays = user?.checkedDays
    && Object.values(user.checkedDays).reduce((prev, curr) => [...prev].concat(curr), []);

    if(!allCheckedDays.includes(yesterday)) {
      user.currentStreak = 0
    }

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