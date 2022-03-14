import { IUserTheme, ThemeNamesEnum, UserData} from './types'

export const defaultTheme: IUserTheme =   {
    colorBlendPercent: 0.14,
    customTheme: null,
    isDarkMode: false,
    themeName: 'INDIGO' as ThemeNamesEnum,
}
  
export const makeDefaultUser = (currentYearMonth:string): UserData=> ({
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
  
 export  function formatDateString(date:number | Date | string) {
    if (typeof date === 'string') return date.slice(0, 15);
    return new Date(date).toString().slice(0, 15);
  }