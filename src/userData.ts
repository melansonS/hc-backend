import { ITheme, IUserTheme, ThemeNamesEnum, UserData } from "./types"

import { subDays, subMonths, getYear, getMonth, startOfToday } from 'date-fns'
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

export async function getUser(uid: string, clientToday:number, clientYesterday:number, clientOffset:number) {
    const timezoneOffset =  new Date().getTimezoneOffset()
    const today = startOfToday().getTime();
    const currentYearMonth = `${getYear(clientToday)}${getMonth(clientToday)}`

    const userFromMongo = await db.collection('Users').findOneAndUpdate(
      {uid},
      {$setOnInsert: {uid, body:makeDefaultUser(currentYearMonth)}},
      {upsert: true, returnDocument:'after'}
    )
    // TODO: error handling...
    const user:UserData = userFromMongo.value.body
    // const yesterday = subDays(today, 1).getTime();
    console.log('timezone offset:', timezoneOffset, '\n')

    console.log('local:',today - (timezoneOffset * 60 * 1000))
    console.log('client:',clientToday - (clientOffset * 60 * 1000), 'yesterday: ', clientYesterday)

    // all of this is only calculated on `getUser` which is only called on log in and page load, needs to be moved elsewhere..

    // default daysInConsecutiveMonths to values in the current {checkedDays[rearMonth]} or to an empty array
    let daysInConsecutiveMonths = user.checkedDays[currentYearMonth] || [];
    let consecutiveMonthIndex = 1;
    let yearMonth = `${getYear(subMonths(clientToday, consecutiveMonthIndex))}${getMonth(subMonths(clientToday, consecutiveMonthIndex))}`;

      console.log(yearMonth, daysInConsecutiveMonths)

    while(user.checkedDays[yearMonth]) {
      const checkedDaysInMonth = user.checkedDays[yearMonth]
      daysInConsecutiveMonths = daysInConsecutiveMonths.concat(checkedDaysInMonth)
      consecutiveMonthIndex++;
      yearMonth = `${getYear(subMonths(clientToday, consecutiveMonthIndex))}${getMonth(subMonths(clientToday, consecutiveMonthIndex))}`;
    }

    let currentStreak = daysInConsecutiveMonths.includes(clientToday) ? 1 : 0;
    if (daysInConsecutiveMonths && daysInConsecutiveMonths.includes(clientYesterday)) {
      // confirm that {yesterday - 1} is actually checked
      const msInADay = 60*60*24*1000 // 86400000
      let i  = 0;
      let date = clientYesterday;
      while (daysInConsecutiveMonths.includes(date)) {
        currentStreak += 1;
        i++
        date = date - (86400000 * i);
        console.log(i)
      }
    }

    const allCheckedDays = user?.checkedDays
    && Object.values(user.checkedDays).reduce((prev, curr) => [...prev].concat(curr), []);

    if(!allCheckedDays.includes(clientYesterday)) {
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