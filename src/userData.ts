import { ITheme, ThemeNamesEnum } from "./types"

const { startOfDay, subDays, subMonths, getYear, getMonth } = require('date-fns')


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


const mockData : {[key:string]:UserData} = {
    'google-oauth2|100686009556826214729' : {
        name:"sam",
        checkedDays: {
            '202111': [1639198800000, 1639198800001,1639198800002],
            '20220': [1641445200000, 1643518800000 ,1643605200000],
            '20221': [
                1643691600000, 1643778000000,
                1643864400000, 1643950800000,
                1644037200000, 1644123600000,
                1644210000000, 1644296400000,
                1644382800000, 1644469200000,
                1644555600000, 1644642000000,
                1644728400000, 1644814800000,
                1644901200000, 1644987600000,
                1645074000000, 1645160400000
            ],
          },
          isStreaking: false,
          currentStreak: 0,
          longestStreak: 0,
          totalDays: 0,
          theme: {
            colorBlendPercent: 0.18,
            customTheme: null,
            isDarkMode: true,
            themeName: 'FOUREST' as ThemeNamesEnum,
          }
    },
    'auth0|620be4e1d8973c00717b81a8': {
        name: 'pete',
        checkedDays:{},
        isStreaking: false,
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        theme: defaultTheme
    }
    
}

export function getUser(uid: string) {
    const user = mockData[uid]
    const today = startOfDay(new Date()).getTime();
    const yesterday = subDays(today, 1).getTime();
    const currentYearMonth = `${getYear(today)}${getMonth(today)}`

    if (user?.checkedDays && !user.checkedDays[currentYearMonth].includes(yesterday)) {
        console.log('am not streaking');
        user.currentStreak = 0;
    }

    let currentStreak = 0
    // default daysInConsecutiveMonths to values is in the current {checkedDays[rearMonth]} or to an empty array
    const daysInConsecutiveMonths = user.checkedDays[currentYearMonth] || [];
    let consecutiveMonthIndex = 1;
    let yearMonth = `${getYear(subMonths(today, consecutiveMonthIndex))}${getMonth(subMonths(today, consecutiveMonthIndex))}`;
    
    while(user.checkedDays[yearMonth]) {
        daysInConsecutiveMonths.push(...user.checkedDays[yearMonth])
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
  && Object.values(user.checkedDays).reduce((prev, curr) => prev.concat(curr), []);


    user.currentStreak = currentStreak;
    user.totalDays = allCheckedDays.length;
    return user;
}