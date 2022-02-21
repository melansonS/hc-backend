export enum ThemeNamesEnum {
  RED = 'RED',
  PURPLE = 'PURPLE',
  INDIGO = 'INDIGO',
  FOUREST = 'FOUREST',
}

export type IColor = {
  50: string,
  100: string,
  200: string,
  300: string,
  400: string,
  500: string,
  600: string,
  700: string,
  800: string,
  900: string,
  A100: string,
  A200: string,
  A400: string,
  A700: string,
  contrastText: string,
  dark: string,
  light: string,
  main: string,
}

export type ITheme = {
  primary: Partial<IColor>,
  secondary: Partial<IColor>,
}
