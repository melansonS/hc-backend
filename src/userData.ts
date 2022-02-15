type UserData = {
  name: string
  checkedDays: {
      [name: string]: number[]
    }
}

const mockData : {[key:string]:UserData} = {
    'google-oauth2|100686009556826214729' : {
        name:"sam",
        checkedDays: {
            202111: [1639198800000],
            20221: [1643778000000, 1643864400000],
          },
    },
    'auth0|620be4e1d8973c00717b81a8': {
        name: 'pete',
        checkedDays:{}
    }
    
}

export function getUser(uid: string) {
    return mockData[uid]
}