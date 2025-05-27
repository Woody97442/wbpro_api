export const jwtVerify = jest.fn(async () => ({
    payload: {
        level: 2,
        userId: 'mock-user-id',
    },
}))