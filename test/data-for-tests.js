export const testData = [{
  // Users
    testUser: {
      username: "DevTest",
      email: "user1@test1.com",
      password: "123123",
      passwordRepeat: "123123",
    },

    testUserUpdate: {
      username: "DevTest",
      password: "321321",
      passwordRepeat: "321321",
    },
    
    testUserWrong1: {
      username: "!£$%^&*(",
      email: "user1test1.com",
      password: "123123",
      passwordRepeat: "123123",
    },

    testUserWrong2: {
      username: "",
      email: "",
      password: "",
      passwordRepeat: "",
    },
  // Points
    testPointCorrect1 : {
      pos: {
        lat: 52,
        lon: -7,
      },
      data: {
        name: "Test1",
        description: "Test1",
        categories: ["DevTest", "test1", "test11"],
      },
    },
    testPointCorrect2 : {
      pos: {
        lat: 44,
        lon: -8,
      },
      data: {
        name: "Test2",
        description: "Test2",
        categories: ["DevTest", "test2", "test22"],
      },
    },
    testPointWrong1 : {
      pos: {
        lat: "string",
        lon: "string",
      },
      data: {
        name: 87,
        description: 44,
        categories: ["DevTest", 34, false],
      },
    },
    testPointWrong2 : {
      pos: {
        lat: true,
        lon: false,
      },
      data: {
        name: 87,
        description: 44,
        categories: ["DevTest", 34, false],
      },
    },
}];