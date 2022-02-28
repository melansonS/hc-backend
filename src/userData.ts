import { ITheme, ThemeNamesEnum } from "./types"

import { startOfDay, subDays, subMonths, getYear, getMonth } from 'date-fns'
import { db } from "./index"

type IUserTheme = {
    colorBlendPercent: number,
    customTheme: Partial<ITheme> | null,
    isDarkMode: boolean,
    themeName: ThemeNamesEnum,
  }


type UserData = {
  name: string
  checkedDays: {
      [name: string]: number[]
    }
  isStreaking: boolean
  currentStreak: number
  longestStreak: number
  totalDays: number,
  theme: IUserTheme
}

const defaultTheme: IUserTheme =   {
  colorBlendPercent: 0.14,
  customTheme: null,
  isDarkMode: false,
  themeName: 'INDIGO' as ThemeNamesEnum,
}

const makeDefaultUser = (currentYearMonth:string) :UserData=> ({
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

    const today = startOfDay(new Date()).getTime();
    const currentYearMonth = `${getYear(today)}${getMonth(today)}`

    const userFromMongo = await db.collection('Users').findOneAndUpdate(
      {uid},
      {$setOnInsert: {uid, body:makeDefaultUser(currentYearMonth)}},
      {upsert: true, returnDocument:'after'}
    )
    // TODO: error handling...
    const user:UserData = userFromMongo.value.body
    const yesterday = subDays(today, 1).getTime();
    
    if (user?.checkedDays && !user.checkedDays[currentYearMonth].includes(yesterday)) {
      console.log('am not streaking');
      user.currentStreak = 0;
    }
    
    // all of this is only calculated on `getUser` which is only called on log in and page load, needs to be moved elsewhere..
    
    let currentStreak = 0
    // default daysInConsecutiveMonths to values in the current {checkedDays[rearMonth]} or to an empty array
    const daysInConsecutiveMonths = user.checkedDays[currentYearMonth] || [];
    let consecutiveMonthIndex = 1;
    let yearMonth = `${getYear(subMonths(today, consecutiveMonthIndex))}${getMonth(subMonths(today, consecutiveMonthIndex))}`;
    
    while(user.checkedDays[yearMonth]) {
      daysInConsecutiveMonths.concat(...user.checkedDays[yearMonth])
      consecutiveMonthIndex++;
      yearMonth = `${getYear(subMonths(today, consecutiveMonthIndex))}${getMonth(subMonths(today, consecutiveMonthIndex))}`;
    }

    if (daysInConsecutiveMonths && daysInConsecutiveMonths.includes(yesterday)) {
      // confirm that {yesterday - 1} is actually checked
      let i = yesterday;
      while (daysInConsecutiveMonths.includes(i)) {
        currentStreak += 1;
        i = subDays(i, 1).getTime();
      }
    }

    const allCheckedDays = user?.checkedDays
    && Object.values(user.checkedDays).reduce((prev, curr) => [...prev].concat(curr), []);
    
    user.currentStreak = currentStreak;
    user.totalDays = allCheckedDays.length;
    return user;
}

export async function updateUser (user:UserData, uid:string) {
  const userFromMongo = await db.collection('Users').findOneAndUpdate({uid}, {$set: {body: user}})
  const updatedUser:UserData = userFromMongo.value.body
  
  return updatedUser
}