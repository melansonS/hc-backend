import { ITheme, IUserTheme, ThemeNamesEnum, UserData } from "./types"

import { subMonths, getYear, format, getMonth, startOfToday, getDate, startOfYesterday, subDays } from 'date-fns'
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

export async function getUser(uid: string, today: string) {
    const todayTimeStamp = startOfToday().getTime()
    const yesterdayTimeStamp = subDays(new Date(), 1).getTime();
    const yearMonthFormat = 'yyyy LLL'
    const currentYearMonthString = format(todayTimeStamp, yearMonthFormat);
    const userFromMongo = await db.collection('Users').findOneAndUpdate(
      {uid},
      {$setOnInsert: {uid, body:makeDefaultUser(currentYearMonthString)}},
      {upsert: true, returnDocument:'after'}
    )

    // TODO: error handling...
    const user:UserData = userFromMongo.value.body

    // all of this is only calculated on `getUser` which is only called on log in and page load, needs to be moved elsewhere..
    
    let daysInConsecutiveMonths = user.checkedDays[currentYearMonthString] || [];
    let consecutiveMonthStringIndex = 1;
    let previousYearMonthString = format(subMonths(todayTimeStamp, consecutiveMonthStringIndex), yearMonthFormat)

    while(user.checkedDays[previousYearMonthString]) {
      console.log(previousYearMonthString, '<<')
      const checkedDaysInMonth = user.checkedDays[previousYearMonthString]
      daysInConsecutiveMonths = daysInConsecutiveMonths.concat(checkedDaysInMonth)
      consecutiveMonthStringIndex++;
      previousYearMonthString = format(subMonths(todayTimeStamp, consecutiveMonthStringIndex), yearMonthFormat)
    }

    let currentStreak = 0
    if (daysInConsecutiveMonths && daysInConsecutiveMonths.includes(new Date(yesterdayTimeStamp).toString().slice(0,15))) {
      let date = new Date(yesterdayTimeStamp).toString().slice(0, 15);
      while (daysInConsecutiveMonths.includes(new Date(date).toString().slice(0, 15))) {
        currentStreak += 1;
        date = new Date(subDays(yesterdayTimeStamp, currentStreak)).toString().slice(0,15)
      }
      if( daysInConsecutiveMonths.includes(today) ) currentStreak += 1;
    }

    const allCheckedDays = user?.checkedDays
    && Object.values(user.checkedDays).reduce((prev, curr) => [...prev].concat(curr), []);

    if(!allCheckedDays.includes(new Date(yesterdayTimeStamp).toString().slice(0,15))) {
      user.currentStreak = 0
    }

    if(currentStreak > user.longestStreak) user.longestStreak = currentStreak;
    user.currentStreak = currentStreak;
    user.totalDays = allCheckedDays.length;
    return user;
}

export async function updateUser (user:UserData, uid:string) {

  console.log(user.checkedDays)
  const userFromMongo = await db.collection('Users').findOneAndUpdate({uid}, {$set: {body: user}}, {returnDocument: 'after'})
  const updatedUser:UserData = userFromMongo.value.body

  return updatedUser
}